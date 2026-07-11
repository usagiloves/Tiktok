import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LarkRecordService } from '../lark/lark-record.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { NormalizerService, NormalizedData, ShopMeta } from './normalizer.service';
import { SYNC_ACTIONS, SYNC_STATUSES, SYNC_MIN_DATE } from '../../common/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly larkRecordService: LarkRecordService,
    private readonly larkBotService: LarkBotService,
    private readonly normalizerService: NormalizerService,
  ) {}

  /**
   * Tách các field _raw_* ra khỏi payload trước khi gửi lên Lark.
   * Các field này chỉ lưu trong DB để debug.
   */
  private stripRawFields(payload: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!key.startsWith('_raw_')) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Sync một đơn hàng từ TikTok raw data → DB → Lark.
   * Flow đầy đủ: normalize → chống update thừa → upsert DB → upsert Lark → log
   */
  async syncOrder(
    rawOrder: Record<string, unknown>,
    shopMeta: ShopMeta,
    source: string,
  ): Promise<{ action: string; syncKey: string }> {
    const traceId = uuidv4().substring(0, 8);

    try {
      // 1. Normalize
      const normalized = this.normalizerService.normalizeOrder(
        rawOrder,
        shopMeta,
      );

      return this.processNormalizedData(normalized, source, traceId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ [${traceId}] syncOrder failed: ${errorMessage}`);

      await this.logSync(traceId, 'UNKNOWN', SYNC_ACTIONS.ERROR, source, SYNC_STATUSES.FAILED, errorMessage);

      throw error;
    }
  }

  /**
   * Sync một yêu cầu hoàn/trả/hủy/khiếu nại.
   */
  async syncReturn(
    rawReturn: Record<string, unknown>,
    shopMeta: ShopMeta,
    requestType: string,
    source: string,
  ): Promise<{ action: string; syncKey: string }> {
    const traceId = uuidv4().substring(0, 8);

    try {
      const normalized = this.normalizerService.normalizeReturn(
        rawReturn,
        shopMeta,
        requestType,
      );

      return this.processNormalizedData(normalized, source, traceId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ [${traceId}] syncReturn failed: ${errorMessage}`);

      await this.logSync(traceId, 'UNKNOWN', SYNC_ACTIONS.ERROR, source, SYNC_STATUSES.FAILED, errorMessage);

      throw error;
    }
  }

  /**
   * Xử lý dữ liệu đã normalize: chống update thừa → upsert DB → upsert Lark → log
   */
  private async processNormalizedData(
    normalized: NormalizedData,
    source: string,
    traceId: string,
  ): Promise<{ action: string; syncKey: string }> {
    // 2. Chống update thừa
    const existingRequest = await this.prisma.normalizedRequest.findUnique({
      where: { syncKey: normalized.syncKey },
    });

    // 2.5 Lấy Ngày tạo đơn từ đơn gốc nếu đây là đơn Hoàn/Trả
    if (normalized.requestType !== 'ORDER' && !normalized.orderCreatedAt) {
      const orderRecord = await this.prisma.normalizedRequest.findFirst({
        where: {
          platform: normalized.platform,
          shopId: normalized.shopId,
          orderId: normalized.orderId,
          requestType: 'ORDER',
        },
      });
      if (orderRecord?.orderCreatedAt) {
        normalized.orderCreatedAt = orderRecord.orderCreatedAt;
        normalized.larkFields['Ngày tạo đơn'] = this.normalizerService.formatLarkDateTime(orderRecord.orderCreatedAt);
      }
    }

    if (
      existingRequest &&
      normalized.lastTiktokUpdateTime &&
      existingRequest.lastTiktokUpdateTime &&
      normalized.lastTiktokUpdateTime <= existingRequest.lastTiktokUpdateTime
    ) {
      this.logger.debug(
        `⏭️ [${traceId}] Skipping ${normalized.syncKey} - no newer update`,
      );

      await this.logSync(
        traceId,
        normalized.syncKey,
        SYNC_ACTIONS.SKIP,
        source,
        SYNC_STATUSES.SUCCESS,
      );

      return { action: SYNC_ACTIONS.SKIP, syncKey: normalized.syncKey };
    }

    // 3. Upsert DB
    const mergedPayload = {
      ...((existingRequest?.payload as Record<string, unknown>) || {}),
      ...(normalized.larkFields as Record<string, unknown>),
    };

    await this.prisma.normalizedRequest.upsert({
      where: { syncKey: normalized.syncKey },
      update: {
        internalStatus: normalized.internalStatus,
        isComplaint: normalized.isComplaint,
        warehouseReceivedAt: normalized.warehouseReceivedAt || existingRequest?.warehouseReceivedAt,
        orderCreatedAt: normalized.orderCreatedAt || existingRequest?.orderCreatedAt,
        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
        payload: mergedPayload as object,
      },
      create: {
        syncKey: normalized.syncKey,
        platform: normalized.platform,
        shopId: normalized.shopId,
        brand: normalized.brand,
        orderId: normalized.orderId,
        requestId: normalized.requestId,
        requestType: normalized.requestType,
        internalStatus: normalized.internalStatus,
        isComplaint: normalized.isComplaint,
        orderCreatedAt: normalized.orderCreatedAt,
        warehouseReceivedAt: normalized.warehouseReceivedAt,
        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
        payload: mergedPayload as object,
      },
    });

    // 4. Upsert Lark (chỉ update field auto, không ghi đè field thủ công)
    // Strip _raw_* fields trước khi gửi Lark (chỉ lưu DB)
    const larkPayload = this.stripRawFields(mergedPayload);
    const upsertResult = await this.larkRecordService.upsertRecord({
      syncKey: normalized.syncKey,
      fields: larkPayload,
    });

    this.logger.log(
      `✅ [${traceId}] ${upsertResult.action} ${normalized.syncKey} → Lark record ${upsertResult.recordId}`,
    );

    // 5. Log
    await this.logSync(
      traceId,
      normalized.syncKey,
      upsertResult.action,
      source,
      SYNC_STATUSES.SUCCESS,
    );

    return { action: upsertResult.action, syncKey: normalized.syncKey };
  }

  /**
   * Batch Sync Orders.
   */
  async syncOrdersBatch(
    rawOrders: Record<string, unknown>[],
    shopMeta: ShopMeta,
    source: string,
  ): Promise<{ total: number; created: number; updated: number; skipped: number; errors: number }> {
    const traceId = uuidv4().substring(0, 8);
    const stats = { total: rawOrders.length, created: 0, updated: 0, skipped: 0, errors: 0 };
    
    try {
      this.logger.log(
        `📦 [${traceId}] Batch syncing ${rawOrders.length} orders...`,
      );

      // Lọc orders trước SYNC_MIN_DATE
      const minTimestamp = Math.floor(SYNC_MIN_DATE.getTime() / 1000);
      const filtered = rawOrders.filter(raw => {
        const createTime = Number(raw.order_create_time || raw.create_time || 0);
        return createTime >= minTimestamp;
      });

      if (filtered.length === 0) {
        this.logger.debug(`⏭️ [${traceId}] All ${rawOrders.length} orders are before SYNC_MIN_DATE (${SYNC_MIN_DATE.toISOString()}), skipping entirely`);
        stats.skipped += rawOrders.length;
        return stats;
      }
      if (filtered.length < rawOrders.length) {
        this.logger.debug(`⏭️ [${traceId}] Filtered out ${rawOrders.length - filtered.length} old orders (before ${SYNC_MIN_DATE.toISOString()}), proceeding with ${filtered.length} orders`);
        stats.skipped += rawOrders.length - filtered.length;
      }

      const normalizedList = filtered.map(raw => 
        shopMeta.platform === 'SHOPEE' 
          ? this.normalizerService.normalizeShopeeOrder(raw, shopMeta)
          : this.normalizerService.normalizeOrder(raw, shopMeta)
      );
      
      const batchStats = await this.processBatchNormalizedData(normalizedList, source, traceId);
      stats.created += batchStats.created;
      stats.updated += batchStats.updated;
      stats.skipped += batchStats.skipped;
      stats.errors += batchStats.errors;
      return stats;
    } catch (error) {
      this.logger.error(`❌ [${traceId}] syncOrdersBatch failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      stats.errors += rawOrders.length;
      return stats;
    }
  }

  /**
   * Batch Sync Returns.
   */
  async syncReturnsBatch(
    rawReturns: Record<string, unknown>[],
    shopMeta: ShopMeta,
    requestType: string,
    source: string,
  ): Promise<{ total: number; created: number; updated: number; skipped: number; errors: number }> {
    const traceId = uuidv4().substring(0, 8);
    const stats = { total: rawReturns.length, created: 0, updated: 0, skipped: 0, errors: 0 };
    
    try {
      // Lọc return/refund trước SYNC_MIN_DATE
      const minTimestamp = Math.floor(SYNC_MIN_DATE.getTime() / 1000);
      const filtered = rawReturns.filter(raw => {
        const createTime = Number(raw.order_create_time || raw.create_time || 0);
        return createTime >= minTimestamp;
      });

      if (filtered.length === 0) {
        this.logger.debug(`⏭️ [${traceId}] All ${rawReturns.length} returns are before SYNC_MIN_DATE (${SYNC_MIN_DATE.toISOString()}), skipping entirely`);
        stats.skipped += rawReturns.length;
        return stats;
      }
      if (filtered.length < rawReturns.length) {
        this.logger.debug(`⏭️ [${traceId}] Filtered out ${rawReturns.length - filtered.length} old returns (before ${SYNC_MIN_DATE.toISOString()}), proceeding with ${filtered.length} returns`);
        stats.skipped += rawReturns.length - filtered.length;
      }

      const normalizedList = filtered.map(raw => 
        shopMeta.platform === 'SHOPEE'
          ? this.normalizerService.normalizeShopeeReturn(raw, shopMeta)
          : this.normalizerService.normalizeReturn(raw, shopMeta, requestType)
      );
      const batchStats = await this.processBatchNormalizedData(normalizedList, source, traceId);
      stats.created += batchStats.created;
      stats.updated += batchStats.updated;
      stats.skipped += batchStats.skipped;
      stats.errors += batchStats.errors;
      return stats;
    } catch (error) {
      this.logger.error(`❌ [${traceId}] syncReturnsBatch failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      stats.errors += rawReturns.length;
      return stats;
    }
  }

  /**
   * Xử lý Batch dữ liệu đã normalize.
   */
  private async processBatchNormalizedData(
    normalizedList: NormalizedData[],
    source: string,
    traceId: string,
  ): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
    const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };
    if (normalizedList.length === 0) return stats;

    const syncKeys = normalizedList.map(n => n.syncKey);
    
    // 1. Lấy thông tin DB
    const existingRequests = await this.prisma.normalizedRequest.findMany({
      where: { syncKey: { in: syncKeys } }
    });
    const existingMap = new Map(existingRequests.map(r => [r.syncKey, r]));

    // 1.5 Xử lý "Ngày tạo đơn" cho các đơn Returns
    const returnRequests = normalizedList.filter(n => n.requestType !== 'ORDER' && !n.orderCreatedAt);
    if (returnRequests.length > 0) {
       const orderIds = returnRequests.map(r => r.orderId);
       const orderRecords = await this.prisma.normalizedRequest.findMany({
          where: { orderId: { in: orderIds }, requestType: 'ORDER' }
       });
       const orderRecordMap = new Map(orderRecords.map(r => [`${r.platform}_${r.shopId}_${r.orderId}`, r]));
       for (const n of returnRequests) {
         const orderRecord = orderRecordMap.get(`${n.platform}_${n.shopId}_${n.orderId}`);
         if (orderRecord?.orderCreatedAt) {
           n.orderCreatedAt = orderRecord.orderCreatedAt;
           n.larkFields['Ngày tạo đơn'] = this.normalizerService.formatLarkDateTime(orderRecord.orderCreatedAt);
         }
       }
    }

    // 2. Chống update thừa
    const toProcess: NormalizedData[] = [];
    for (const normalized of normalizedList) {
      const existing = existingMap.get(normalized.syncKey);
      if (
        existing &&
        normalized.lastTiktokUpdateTime &&
        existing.lastTiktokUpdateTime &&
        normalized.lastTiktokUpdateTime <= existing.lastTiktokUpdateTime
      ) {
         stats.skipped++;
         continue; // Skip
      }
      toProcess.push(normalized);
    }

    if (toProcess.length === 0) return stats;

    try {
      // 3. Upsert DB (Batch)
      const upsertPromises = toProcess.map(normalized => {
        const existingRequest = existingMap.get(normalized.syncKey);
        const mergedPayload = {
          ...((existingRequest?.payload as Record<string, unknown>) || {}),
          ...(normalized.larkFields as Record<string, unknown>),
        };
        
        return this.prisma.normalizedRequest.upsert({
          where: { syncKey: normalized.syncKey },
          update: {
            internalStatus: normalized.internalStatus,
            isComplaint: normalized.isComplaint,
            warehouseReceivedAt: normalized.warehouseReceivedAt || existingRequest?.warehouseReceivedAt,
            orderCreatedAt: normalized.orderCreatedAt || existingRequest?.orderCreatedAt,
            lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
            payload: mergedPayload as object,
          },
          create: {
            syncKey: normalized.syncKey,
            platform: normalized.platform,
            shopId: normalized.shopId,
            brand: normalized.brand,
            orderId: normalized.orderId,
            requestId: normalized.requestId,
            requestType: normalized.requestType,
            internalStatus: normalized.internalStatus,
            isComplaint: normalized.isComplaint,
            orderCreatedAt: normalized.orderCreatedAt,
            warehouseReceivedAt: normalized.warehouseReceivedAt,
            lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
            payload: mergedPayload as object,
          },
        });
      });

      await this.prisma.$transaction(upsertPromises);

      // 4. Upsert Lark Batch (strip _raw_* fields trước khi gửi Lark)
      const larkPayloads = toProcess.map(normalized => {
        const existingRequest = existingMap.get(normalized.syncKey);
        const mergedPayload = {
          ...((existingRequest?.payload as Record<string, unknown>) || {}),
          ...(normalized.larkFields as Record<string, unknown>),
        };
        return { syncKey: normalized.syncKey, fields: this.stripRawFields(mergedPayload) };
      });

      const upsertResult = await this.larkRecordService.batchUpsertRecords(larkPayloads);
      
      if (!upsertResult) {
        this.logger.error(`❌ [${traceId}] upsertResult is undefined! larkPayloads length: ${larkPayloads.length}`);
      }

      const safeResult = upsertResult || { created: 0, updated: 0, failed: 0 };
      
      stats.created += safeResult.created;
      stats.updated += safeResult.updated;
      stats.errors += safeResult.failed;

      this.logger.log(`✅ [${traceId}] Batch finished: created=${safeResult.created}, updated=${safeResult.updated}, failed=${safeResult.failed} from source ${source}`);
    } catch (error: any) {
      this.logger.error(`❌ [${traceId}] processBatchNormalizedData failed: ${error.stack || error.message}`);
      stats.errors += toProcess.length;
    }
    
    return stats;
  }

  /**
   * Ghi sync log vào database.
   */
  private async logSync(
    traceId: string,
    syncKey: string,
    action: string,
    source: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.syncLog.create({
        data: {
          traceId,
          syncKey,
          action,
          source,
          status,
          errorMessage,
          createdAt: new Date(),
        },
      });
    } catch (logError: unknown) {
      this.logger.error(
        `Failed to write sync log: ${logError instanceof Error ? logError.message : 'Unknown'}`,
      );
    }
  }

  /**
   * Retry sync cho một sync_key cụ thể.
   */
  async retrySyncBySyncKey(syncKey: string): Promise<{ action: string }> {
    const request = await this.prisma.normalizedRequest.findUnique({
      where: { syncKey },
    });

    if (!request) {
      throw new Error(`No record found for sync_key: ${syncKey}`);
    }

    const payload = (request.payload as Record<string, unknown>) || {};

    const upsertResult = await this.larkRecordService.upsertRecord({
      syncKey,
      fields: this.stripRawFields(payload),
    });

    this.logger.log(`🔄 Retry ${syncKey}: ${upsertResult.action}`);

    await this.logSync(
      uuidv4().substring(0, 8),
      syncKey,
      upsertResult.action,
      'MANUAL_RETRY',
      SYNC_STATUSES.SUCCESS,
    );

    return { action: upsertResult.action };
  }
}
