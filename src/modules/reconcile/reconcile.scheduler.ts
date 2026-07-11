import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconcileService } from './reconcile.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReconcileScheduler {
  private readonly logger = new Logger(ReconcileScheduler.name);

  constructor(
    private readonly reconcileService: ReconcileService,
    private readonly larkBot: LarkBotService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 1. Near Realtime: Mỗi 30 phút, quét 2 giờ gần nhất
   */
  @Cron('*/30 * * * *')
  async reconcileNearRealtime() {
    this.logger.log('⏰ Cron: reconcileNearRealtime started');
    const shops = await this.getActiveShops();
    const stats = { total: 0, created: 0, updated: 0, failed: 0 };

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const twoHoursAgo = now - 2 * 60 * 60;

      let oStats, rStats;
      if (shop.platform === 'TIKTOK') {
        rStats = await this.reconcileService.reconcileReturns(shop.shopId, twoHoursAgo, now);
        oStats = await this.reconcileService.reconcileOrders(shop.shopId, twoHoursAgo, now);
      } else if (shop.platform === 'SHOPEE') {
        rStats = await this.reconcileService.reconcileShopeeReturns(shop.shopId, twoHoursAgo, now);
        oStats = await this.reconcileService.reconcileShopeeOrders(shop.shopId, twoHoursAgo, now);
      }

      if (oStats) { stats.total += oStats.total; stats.created += oStats.created; stats.updated += oStats.updated; stats.failed += oStats.errors; }
      if (rStats) { stats.total += rStats.total; stats.created += rStats.created; stats.updated += rStats.updated; stats.failed += rStats.errors; }
    }

    await this.larkBot.sendSummary({
      jobName: 'Near Realtime (2h)',
      date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      totalSynced: stats.total,
      totalCreated: stats.created,
      totalUpdated: stats.updated,
      totalFailed: stats.failed,
    });
  }

  /**
   * 2. Daily Backfill: Mỗi ngày 02:00, quét 15 ngày gần nhất
   */
  @Cron('0 2 * * *')
  async reconcileDailyBackfill() {
    this.logger.log('⏰ Cron: reconcileDailyBackfill started');
    const shops = await this.getActiveShops();
    const stats = { total: 0, created: 0, updated: 0, failed: 0 };

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const fifteenDaysAgo = now - 15 * 24 * 60 * 60;

      let oStats, rStats;
      if (shop.platform === 'TIKTOK') {
        rStats = await this.reconcileService.reconcileReturns(shop.shopId, fifteenDaysAgo, now);
        oStats = await this.reconcileService.reconcileOrders(shop.shopId, fifteenDaysAgo, now);
      } else if (shop.platform === 'SHOPEE') {
        rStats = await this.reconcileService.reconcileShopeeReturns(shop.shopId, fifteenDaysAgo, now);
        oStats = await this.reconcileService.reconcileShopeeOrders(shop.shopId, fifteenDaysAgo, now);
      }

      if (oStats) { stats.total += oStats.total; stats.created += oStats.created; stats.updated += oStats.updated; stats.failed += oStats.errors; }
      if (rStats) { stats.total += rStats.total; stats.created += rStats.created; stats.updated += rStats.updated; stats.failed += rStats.errors; }
    }

    await this.larkBot.sendSummary({
      jobName: 'Daily Backfill (15 days)',
      date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      totalSynced: stats.total,
      totalCreated: stats.created,
      totalUpdated: stats.updated,
      totalFailed: stats.failed,
    });
  }

  /**
   * 3. Weekly Safety Sweep: Mỗi Chủ nhật 03:00, quét 30 ngày gần nhất
   */
  @Cron('0 3 * * 0')
  async reconcileWeeklySafetySweep() {
    this.logger.log('⏰ Cron: reconcileWeeklySafetySweep started');
    const shops = await this.getActiveShops();
    const stats = { total: 0, created: 0, updated: 0, failed: 0 };

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const fifteenDaysAgo = now - 15 * 24 * 60 * 60;

      if (shop.platform === 'TIKTOK') {
        const rStats = await this.reconcileService.reconcileReturns(shop.shopId, thirtyDaysAgo, now);
        const oStats = await this.reconcileService.reconcileOrders(shop.shopId, thirtyDaysAgo, now);
        if (oStats) { stats.total += oStats.total; stats.created += oStats.created; stats.updated += oStats.updated; stats.failed += oStats.errors; }
        if (rStats) { stats.total += rStats.total; stats.created += rStats.created; stats.updated += rStats.updated; stats.failed += rStats.errors; }
      } else if (shop.platform === 'SHOPEE') {
        // Shopee max update_time range is 15 days, so split into two chunks
        const rStats1 = await this.reconcileService.reconcileShopeeReturns(shop.shopId, fifteenDaysAgo, now);
        const oStats1 = await this.reconcileService.reconcileShopeeOrders(shop.shopId, fifteenDaysAgo, now);
        
        const rStats2 = await this.reconcileService.reconcileShopeeReturns(shop.shopId, thirtyDaysAgo, fifteenDaysAgo);
        const oStats2 = await this.reconcileService.reconcileShopeeOrders(shop.shopId, thirtyDaysAgo, fifteenDaysAgo);

        [oStats1, rStats1, oStats2, rStats2].forEach(s => {
          if (s) {
            stats.total += s.total; stats.created += s.created; stats.updated += s.updated; stats.failed += s.errors;
          }
        });
      }
    }

    await this.larkBot.sendSummary({
      jobName: 'Weekly Safety Sweep (30 days)',
      date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      totalSynced: stats.total,
      totalCreated: stats.created,
      totalUpdated: stats.updated,
      totalFailed: stats.failed,
    });
  }

  /**
   * Lấy danh sách shop active.
   */
  private async getActiveShops() {
    return this.prisma.shop.findMany({
      where: { isActive: true },
    });
  }
}
