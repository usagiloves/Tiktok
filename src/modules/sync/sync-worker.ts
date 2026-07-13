import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncEngineService } from './sync-engine.service';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QUEUE_NAMES, JOB_NAMES, REQUEST_TYPES } from '../../common/constants';

interface SyncJobData {
  orderId?: string;
  returnId?: string;
  shopId: string;
  eventType?: string;
  source: string;
  isFailedDelivery?: boolean;
  warehouseReceivedAtMs?: number;
  isHardCut?: boolean;
}

@Processor(QUEUE_NAMES.SYNC_ORDER)
export class SyncWorker extends WorkerHost {
  private readonly logger = new Logger(SyncWorker.name);

  constructor(
    private readonly syncEngine: SyncEngineService,
    private readonly tiktokApi: TiktokApiClient,
    private readonly larkBot: LarkBotService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<unknown> {
    const { orderId, returnId, shopId, source } = job.data;

    this.logger.log(
      `🔄 Processing job ${job.name}: orderId=${orderId}, returnId=${returnId}, shopId=${shopId}`,
    );

    try {
      // Lấy thông tin brand và cipher từ shop
      const shop = await this.prisma.shop.findFirst({
        where: { shopId, platform: 'TIKTOK' },
      });
      const brand = shop?.brand || 'UNKNOWN';
      const shopCode = shop?.shopCode || null;
      const shopCipher = shop?.shopCipher || '';

      if (job.name === JOB_NAMES.SYNC_ORDER_TO_LARK && orderId) {
        return await this.processOrder(job.data, shopCode, shopCipher, brand);
      }

      if (job.name === JOB_NAMES.SYNC_RETURN_TO_LARK && (returnId || orderId)) {
        return await this.processReturn(
          returnId || orderId || '',
          shopId,
          shopCode,
          shopCipher,
          brand,
          source,
        );
      }

      this.logger.warn(`⚠️ Unknown job name: ${job.name}`);
      return { status: 'skipped', reason: 'unknown_job_name' };
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Unknown error';
      this.logger.error(`❌ Job ${job.name} failed: ${errorMessage}`);

      // Gửi alert nếu job fail lần cuối
      if (job.attemptsMade >= (job.opts?.attempts || 3) - 1) {
        await this.larkBot.sendAlert({
          title: '🚨 CẢNH BÁO SYNC TIKTOK → LARK',
          shopName: shopId,
          errorType: 'Sync job failed',
          orderId: orderId || returnId,
          errorDetail: errorMessage,
          action: 'Kiểm tra logs và retry thủ công nếu cần.',
        });
      }

      throw error;
    }
  }

  private async processOrder(
    jobData: SyncJobData,
    shopCode: string | null,
    shopCipher: string,
    brand: string,
  ) {
    const { orderId, shopId, source, isFailedDelivery, warehouseReceivedAtMs, isHardCut } = jobData;
    if (!orderId) return { status: 'skipped', reason: 'missing_order_id' };

    let orders: any[] = [];
    
    // Nếu là Hard Cut, không gọi API nữa vì đằng nào cũng lỗi
    if (isHardCut) {
      this.logger.log(`[Hard Cut] Constructing fake payload for ${orderId} instead of fetching.`);
      const fakeOrder = {
        order_id: orderId,
        _is_failed_delivery: true,
        _jt_warehouse_received_at: warehouseReceivedAtMs || Date.now()
      };
      orders = [fakeOrder];
    } else {
      // Gọi TikTok API lấy chi tiết đơn
      const orderDetail = (await this.tiktokApi.getOrderDetail(
        shopId,
        shopCipher,
        orderId,
      )) as Record<string, unknown>;

      orders = (orderDetail.orders ||
        orderDetail.order_list || [orderDetail]) as Record<string, unknown>[];
    }

    const results = [];
    for (const order of orders) {
      // Inject các cờ tùy chỉnh từ Failed Delivery Tracker (nếu có)
      if (isFailedDelivery) {
        order._is_failed_delivery = true;
      } else if (!isHardCut) {
        // Áp dụng logic chuẩn từ Reconcile: chặn toàn bộ đơn thường, chỉ nhận Giao hàng thất bại
        const status = String(order.order_status || order.status || '');
        const reason = String(order.cancel_reason || order.cancellation_reason || '').toUpperCase();
        const initiator = String(order.cancellation_initiator || order.cancel_initiator || '').toUpperCase();

        if (status === 'CANCELLED' && 
            initiator !== 'BUYER' && !reason.includes('BUYER') &&
            initiator !== 'SELLER' && !reason.includes('SELLER') &&
            (initiator === 'LOGISTICS' || reason.includes('DELIVERY') || reason.includes('FAIL') || reason.includes('THẤT BẠI') || reason.includes('GIAO GÓI HÀNG') || (initiator === 'SYSTEM' && (reason.includes('GIAO') || reason.includes('DELIVERY'))))
        ) {
          order._is_failed_delivery = true;
        } else {
          this.logger.debug(`[Webhook] Skipping order ${orderId} - Not a Failed Delivery`);
          continue;
        }
      }

      if (warehouseReceivedAtMs) {
        order._jt_warehouse_received_at = warehouseReceivedAtMs;
      }

      const result = await this.syncEngine.syncOrder(
        order,
        { shopId, brand, shopCode },
        source,
      );
      results.push(result);
    }

    return { status: 'success', results };
  }

  private async processReturn(
    returnId: string,
    shopId: string,
    shopCode: string | null,
    shopCipher: string,
    brand: string,
    source: string,
  ) {
    this.logger.debug(`⏭️ [Webhook] Skipping real-time sync for return ${returnId} to save Lark API calls. Relying on Cron job.`);
    return { status: 'skipped_to_save_api_calls', reason: 'disabled_by_user' };
  }

  private detectRequestType(data: Record<string, unknown>): string {
    if (data.cancel_id || data.type === 'CANCEL') return REQUEST_TYPES.CANCEL;
    if (data.refund_id || data.type === 'REFUND_ONLY')
      return REQUEST_TYPES.REFUND;
    if (data.dispute_id || data.is_dispute) return REQUEST_TYPES.COMPLAINT;
    return REQUEST_TYPES.RETURN;
  }
}
