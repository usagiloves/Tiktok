import { Injectable, Logger } from '@nestjs/common';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { SyncEngineService } from '../sync/sync-engine.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { REQUEST_TYPES, SYNC_SOURCES } from '../../common/constants';

@Injectable()
export class ReconcileService {
  private readonly logger = new Logger(ReconcileService.name);

  constructor(
    private readonly tiktokApi: TiktokApiClient,
    private readonly syncEngine: SyncEngineService,
    private readonly larkBot: LarkBotService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Đối soát đơn hàng trong khoảng thời gian.
   * Kéo tất cả đơn thay đổi và sync lại.
   */
  async reconcileOrders(
    shopId: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const shop = await this.prisma.shop.findFirst({
      where: { shopId, platform: 'TIKTOK', isActive: true },
    });

    if (!shop) {
      this.logger.warn(`⚠️ Shop ${shopId} not found or inactive`);
      return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
    }

    const brand = shop.brand || 'UNKNOWN';
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await this.tiktokApi.getOrderList({
          shopId,
          updateTimeFrom: fromTimestamp,
          updateTimeTo: toTimestamp,
          pageSize: 50,
          cursor,
        });

        const orders = (result.orders || []) as Record<string, unknown>[];

        for (const order of orders) {
          stats.total++;
          try {
            const syncResult = await this.syncEngine.syncOrder(
              order,
              shopId,
              brand,
              SYNC_SOURCES.CRON,
            );

            if (syncResult.action === 'CREATE') stats.created++;
            else if (syncResult.action === 'UPDATE') stats.updated++;
            else stats.skipped++;
          } catch {
            stats.errors++;
          }
        }

        cursor = result.nextCursor;
        hasMore = !!cursor && orders.length > 0;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Reconcile orders failed: ${errorMessage}`);
        hasMore = false;
        stats.errors++;
      }
    }

    this.logger.log(
      `📊 Reconcile orders done: total=${stats.total}, created=${stats.created}, updated=${stats.updated}, skipped=${stats.skipped}, errors=${stats.errors}`,
    );

    return stats;
  }

  /**
   * Đối soát hoàn/trả/hủy trong khoảng thời gian.
   */
  async reconcileReturns(
    shopId: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const shop = await this.prisma.shop.findFirst({
      where: { shopId, platform: 'TIKTOK', isActive: true },
    });

    if (!shop) {
      return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
    }

    const brand = shop.brand || 'UNKNOWN';
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await this.tiktokApi.getReturnList({
          shopId,
          updateTimeFrom: fromTimestamp,
          updateTimeTo: toTimestamp,
          pageSize: 50,
          cursor,
        });

        const returns = (result.return_refunds || []) as Record<
          string,
          unknown
        >[];

        for (const returnItem of returns) {
          stats.total++;
          try {
            const requestType = this.detectRequestType(returnItem);

            const syncResult = await this.syncEngine.syncReturn(
              returnItem,
              shopId,
              brand,
              requestType,
              SYNC_SOURCES.CRON,
            );

            if (syncResult.action === 'CREATE') stats.created++;
            else if (syncResult.action === 'UPDATE') stats.updated++;
            else stats.skipped++;
          } catch {
            stats.errors++;
          }
        }

        cursor = result.nextCursor;
        hasMore = !!cursor && returns.length > 0;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Reconcile returns failed: ${errorMessage}`);
        hasMore = false;
        stats.errors++;
      }
    }

    this.logger.log(
      `📊 Reconcile returns done: total=${stats.total}, created=${stats.created}, updated=${stats.updated}, skipped=${stats.skipped}, errors=${stats.errors}`,
    );

    return stats;
  }

  private detectRequestType(data: Record<string, unknown>): string {
    if (data.cancel_id || data.type === 'CANCEL') return REQUEST_TYPES.CANCEL;
    if (data.refund_id || data.type === 'REFUND_ONLY')
      return REQUEST_TYPES.REFUND;
    if (data.dispute_id || data.is_dispute) return REQUEST_TYPES.COMPLAINT;
    return REQUEST_TYPES.RETURN;
  }
}
