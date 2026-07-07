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
   * Mỗi 10 phút: Kéo đơn thay đổi trong 30 phút gần nhất.
   * Overlap 20 phút để chống miss.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcileRecentOrders() {
    this.logger.log('⏰ Cron: reconcileRecentOrders started');

    const shops = await this.getActiveShops();

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const thirtyMinutesAgo = now - 30 * 60;

      await this.reconcileService.reconcileOrders(
        shop.shopId,
        thirtyMinutesAgo,
        now,
      );
    }
  }

  /**
   * Mỗi 30 phút: Kéo return/refund/cancel thay đổi trong 2 giờ gần nhất.
   */
  @Cron('*/30 * * * *')
  async reconcileRecentReturns() {
    this.logger.log('⏰ Cron: reconcileRecentReturns started');

    const shops = await this.getActiveShops();

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const twoHoursAgo = now - 2 * 60 * 60;

      await this.reconcileService.reconcileReturns(
        shop.shopId,
        twoHoursAgo,
        now,
      );
    }
  }

  /**
   * Mỗi ngày 02:00: Đối soát toàn bộ đơn 7 ngày gần nhất.
   */
  @Cron('0 2 * * *')
  async reconcileWeeklyOrders() {
    this.logger.log('⏰ Cron: reconcileWeeklyOrders started');

    const shops = await this.getActiveShops();

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 60 * 60;

      const stats = await this.reconcileService.reconcileOrders(
        shop.shopId,
        sevenDaysAgo,
        now,
      );

      // Gửi báo cáo daily
      const today = new Date().toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });

      await this.larkBot.sendSummary({
        date: today,
        totalSynced: stats.total,
        totalCreated: stats.created,
        totalUpdated: stats.updated,
        totalFailed: stats.errors,
      });
    }
  }

  /**
   * Mỗi tuần (Chủ nhật 03:00): Đối soát hoàn/trả 30 ngày.
   */
  @Cron('0 3 * * 0')
  async reconcileMonthlyReturns() {
    this.logger.log('⏰ Cron: reconcileMonthlyReturns started');

    const shops = await this.getActiveShops();

    for (const shop of shops) {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      await this.reconcileService.reconcileReturns(
        shop.shopId,
        thirtyDaysAgo,
        now,
      );
    }
  }

  /**
   * Lấy danh sách shop active.
   */
  private async getActiveShops() {
    return this.prisma.shop.findMany({
      where: { platform: 'TIKTOK', isActive: true },
    });
  }
}
