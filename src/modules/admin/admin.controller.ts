import {
  Controller,
  Post,
  Get,
  Body,
  Logger,
} from '@nestjs/common';
import { SyncEngineService } from '../sync/sync-engine.service';
import { ReconcileService } from '../reconcile/reconcile.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly syncEngine: SyncEngineService,
    private readonly reconcileService: ReconcileService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // Manual Retry
  // ============================================

  /**
   * POST /admin/sync/retry
   * Retry sync cho một sync_key cụ thể.
   */
  @Post('sync/retry')
  async retrySync(@Body() body: { sync_key: string }) {
    this.logger.log(`🔄 Manual retry for: ${body.sync_key}`);

    const result = await this.syncEngine.retrySyncBySyncKey(body.sync_key);

    return {
      success: true,
      action: result.action,
      sync_key: body.sync_key,
    };
  }

  // ============================================
  // Manual Reconcile
  // ============================================

  /**
   * POST /admin/reconcile/orders
   * Đối soát đơn hàng thủ công theo khoảng ngày.
   */
  @Post('reconcile/orders')
  async reconcileOrders(
    @Body() body: { shop_id: string; from: string; to: string },
  ) {
    this.logger.log(
      `📊 Manual reconcile orders: shop=${body.shop_id}, from=${body.from}, to=${body.to}`,
    );

    const fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
    const toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);

    const stats = await this.reconcileService.reconcileOrders(
      body.shop_id,
      fromTimestamp,
      toTimestamp,
    );

    return { success: true, stats };
  }

  /**
   * POST /admin/reconcile/returns
   * Đối soát hoàn/trả thủ công.
   */
  @Post('reconcile/returns')
  async reconcileReturns(
    @Body() body: { shop_id: string; from: string; to: string },
  ) {
    this.logger.log(
      `📊 Manual reconcile returns: shop=${body.shop_id}, from=${body.from}, to=${body.to}`,
    );

    const fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
    const toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);

    const stats = await this.reconcileService.reconcileReturns(
      body.shop_id,
      fromTimestamp,
      toTimestamp,
    );

    return { success: true, stats };
  }

  // ============================================
  // Dashboard
  // ============================================

  /**
   * GET /admin/dashboard
   * Dashboard sức khỏe hệ thống.
   */
  @Get('dashboard')
  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Thống kê sync hôm nay
    const [
      totalSyncToday,
      failedSyncToday,
      shops,
      tokens,
    ] = await Promise.all([
      this.prisma.syncLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.syncLog.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'FAILED',
        },
      }),
      this.prisma.shop.findMany({
        where: { isActive: true },
        select: { shopId: true, shopName: true, brand: true, platform: true },
      }),
      this.prisma.tiktokToken.findMany({
        select: {
          shopId: true,
          accessTokenExpiredAt: true,
          refreshTokenExpiredAt: true,
        },
      }),
    ]);

    // Kiểm tra token status
    const tokenStatuses = tokens.map((t) => ({
      shopId: t.shopId,
      accessTokenValid:
        t.accessTokenExpiredAt ? t.accessTokenExpiredAt > now : false,
      refreshTokenValid:
        t.refreshTokenExpiredAt ? t.refreshTokenExpiredAt > now : false,
      accessTokenExpiresIn: t.accessTokenExpiredAt
        ? Math.round(
            (t.accessTokenExpiredAt.getTime() - now.getTime()) / 1000 / 60,
          )
        : 0,
    }));

    // Lấy sync errors gần đây
    const recentErrors = await this.prisma.syncLog.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        traceId: true,
        syncKey: true,
        action: true,
        source: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    return {
      status: 'ok',
      time: now.toISOString(),
      today: {
        totalSync: totalSyncToday,
        failedSync: failedSyncToday,
        successRate:
          totalSyncToday > 0
            ? `${(((totalSyncToday - failedSyncToday) / totalSyncToday) * 100).toFixed(1)}%`
            : 'N/A',
      },
      shops,
      tokens: tokenStatuses,
      recentErrors,
    };
  }
}
