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
  eventType: string;
  source: string;
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
      // Lấy thông tin brand từ shop
      const shop = await this.prisma.shop.findFirst({
        where: { shopId, platform: 'TIKTOK' },
      });
      const brand = shop?.brand || 'UNKNOWN';

      if (job.name === JOB_NAMES.SYNC_ORDER_TO_LARK && orderId) {
        return await this.processOrder(orderId, shopId, brand, source);
      }

      if (job.name === JOB_NAMES.SYNC_RETURN_TO_LARK && (returnId || orderId)) {
        return await this.processReturn(
          returnId || orderId || '',
          shopId,
          brand,
          source,
        );
      }

      this.logger.warn(`⚠️ Unknown job name: ${job.name}`);
      return { status: 'skipped', reason: 'unknown_job_name' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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
    orderId: string,
    shopId: string,
    brand: string,
    source: string,
  ) {
    // Gọi TikTok API lấy chi tiết đơn
    const orderDetail = (await this.tiktokApi.getOrderDetail(
      shopId,
      orderId,
    )) as Record<string, unknown>;

    // Có thể trả về list orders
    const orders = (orderDetail.orders ||
      orderDetail.order_list || [orderDetail]) as Record<string, unknown>[];

    const results = [];
    for (const order of orders) {
      const result = await this.syncEngine.syncOrder(
        order,
        shopId,
        brand,
        source,
      );
      results.push(result);
    }

    return { status: 'success', results };
  }

  private async processReturn(
    returnId: string,
    shopId: string,
    brand: string,
    source: string,
  ) {
    const returnDetail = (await this.tiktokApi.getReturnDetail(
      shopId,
      returnId,
    )) as Record<string, unknown>;

    // Xác định loại yêu cầu
    const requestType = this.detectRequestType(returnDetail);

    const result = await this.syncEngine.syncReturn(
      returnDetail,
      shopId,
      brand,
      requestType,
      source,
    );

    return { status: 'success', result };
  }

  private detectRequestType(data: Record<string, unknown>): string {
    if (data.cancel_id || data.type === 'CANCEL') return REQUEST_TYPES.CANCEL;
    if (data.refund_id || data.type === 'REFUND_ONLY')
      return REQUEST_TYPES.REFUND;
    if (data.dispute_id || data.is_dispute) return REQUEST_TYPES.COMPLAINT;
    return REQUEST_TYPES.RETURN;
  }
}
