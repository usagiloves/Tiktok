import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LarkRecordService } from '../lark/lark-record.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { NormalizerService, NormalizedData } from './normalizer.service';
import { SYNC_ACTIONS, SYNC_STATUSES } from '../../common/constants';
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
   * Sync một đơn hàng từ TikTok raw data → DB → Lark.
   * Flow đầy đủ: normalize → chống update thừa → upsert DB → upsert Lark → log
   */
  async syncOrder(
    rawOrder: Record<string, unknown>,
    shopId: string,
    brand: string,
    source: string,
  ): Promise<{ action: string; syncKey: string }> {
    const traceId = uuidv4().substring(0, 8);

    try {
      // 1. Normalize
      const normalized = this.normalizerService.normalizeOrder(
        rawOrder,
        shopId,
        brand,
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
    shopId: string,
    brand: string,
    requestType: string,
    source: string,
  ): Promise<{ action: string; syncKey: string }> {
    const traceId = uuidv4().substring(0, 8);

    try {
      const normalized = this.normalizerService.normalizeReturn(
        rawReturn,
        shopId,
        brand,
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
    await this.prisma.normalizedRequest.upsert({
      where: { syncKey: normalized.syncKey },
      update: {
        internalStatus: normalized.internalStatus,
        isComplaint: normalized.isComplaint,
        warehouseReceivedAt: normalized.warehouseReceivedAt,
        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
        payload: normalized.larkFields as object,
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
        payload: normalized.larkFields as object,
      },
    });

    // 4. Upsert Lark (chỉ update field auto, không ghi đè field thủ công)
    const upsertResult = await this.larkRecordService.upsertRecord({
      syncKey: normalized.syncKey,
      fields: normalized.larkFields,
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
      fields: payload,
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
