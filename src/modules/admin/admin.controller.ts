import {
  Controller,
  Post,
  Get,
  Body,
  Logger,
  Param,
} from '@nestjs/common';
import { SyncEngineService } from '../sync/sync-engine.service';
import { ReconcileService } from '../reconcile/reconcile.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';

import { HttpService } from '@nestjs/axios';
import { TiktokTokenService } from '../tiktok/tiktok-token.service';
import * as crypto from 'crypto';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly syncEngine: SyncEngineService,
    private readonly reconcileService: ReconcileService,
    private readonly prisma: PrismaService,
    private readonly tiktokApi: TiktokApiClient,
  ) {}
  @Get('test-order/:id')
  async testOrder(@Param('id') orderId: string) {
    const shop = await this.prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) {
      throw new Error('No active shop found');
    }
    
    try {
      const orderDetail = await this.tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', orderId);
      return orderDetail;
    } catch (e: any) {
      return {
        error: e.message,
        response: e.response?.data
      };
    }
  }

  @Post('test-order/push/:id')
  async pushTestOrder(@Param('id') orderId: string) {
    const shop = await this.prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) {
      throw new Error('No active shop found');
    }
    
    try {
      const orderDetail = await this.tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', orderId);
      if (orderDetail.orders && orderDetail.orders.length > 0) {
        const order = orderDetail.orders[0];
        // Flag for normalizer
        order._is_failed_delivery = true; 
        
        await this.syncEngine.syncOrdersBatch([order], { shopId: shop.shopId, brand: shop.brand || 'Goodfit', shopCode: shop.shopCode || null }, 'MANUAL');
        return { success: true, message: `Pushed order ${orderId} to LarkBase successfully.` };
      } else {
        return { success: false, message: 'Order not found from TikTok API' };
      }
    } catch (e: any) {
      return {
        error: e.message,
        response: e.response?.data
      };
    }
  }

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

  /**
   * POST /admin/reconcile/historical
   * Quét bù (Backlog Sweep) toàn bộ đơn hàng và hoàn trả từ một mốc thời gian cho TẤT CẢ các shop active.
   */
  @Post('reconcile/historical')
  async historicalSweep(@Body() body: { from: string }) {
    this.logger.log(`📊 Manual Historical Sweep starting from ${body.from}...`);
    
    const fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    
    const shops = await this.prisma.shop.findMany({ where: { isActive: true } });
    
    const results = [];
    
    for (const shop of shops) {
      this.logger.log(`Sweeping shop ${shop.shopName} (${shop.platform})`);
      let orderStats = { total: 0, updated: 0, errors: 0 };
      let returnStats = { total: 0, updated: 0, errors: 0 };
      
      try {
        if (shop.platform === 'TIKTOK') {
          orderStats = await this.reconcileService.reconcileOrders(shop.shopId, fromTimestamp, nowTimestamp) || orderStats;
          returnStats = await this.reconcileService.reconcileReturns(shop.shopId, fromTimestamp, nowTimestamp) || returnStats;
        } else if (shop.platform === 'SHOPEE') {
          // Shopee max update_time range is 15 days, so we split it into 15-day chunks
          let currentTo = nowTimestamp;
          let currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
          
          while (currentTo > fromTimestamp) {
            const oStats = await this.reconcileService.reconcileShopeeOrders(shop.shopId, currentFrom, currentTo);
            const rStats = await this.reconcileService.reconcileShopeeReturns(shop.shopId, currentFrom, currentTo);
            
            if (oStats) { orderStats.total += oStats.total; orderStats.updated += oStats.updated; orderStats.errors += oStats.errors; }
            if (rStats) { returnStats.total += rStats.total; returnStats.updated += rStats.updated; returnStats.errors += rStats.errors; }
            
            currentTo = currentFrom;
            currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
          }
        }
      } catch (err: any) {
        this.logger.error(`❌ Failed to sweep shop ${shop.shopName}: ${err.message}`);
      }
      
      results.push({
        shopId: shop.shopId,
        platform: shop.platform,
        orders: orderStats,
        returns: returnStats
      });
    }
    
    this.logger.log(`✅ Historical Sweep completed.`);
    return { success: true, results };
  }

  // ============================================
  // Dashboard
  // ============================================

  /**
   * GET /admin/dashboard
   * Dashboard sức khỏe hệ thống.
   */
  @Get('dashboard')
  async dashboard() {
    const activeShops = await this.prisma.shop.count({ where: { isActive: true } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const syncLogsCount = await this.prisma.syncLog.count({
      where: {
        createdAt: { gte: today }
      }
    });

    return {
      success: true,
      data: {
        activeShops,
        syncLogsToday: syncLogsCount,
        status: 'OK'
      }
    };
  }

  @Get('fix-ciphers')
  async fixCiphers() {
    const shops = await this.prisma.shop.findMany({ where: { platform: 'TIKTOK' } });
    for (const shop of shops) {
      if (!shop.shopCipher || shop.shopCipher === 'none') {
        try {
          const authData = await this.tiktokApi.getAuthorizedShops(shop.shopId);
          if (authData && authData.shops) {
            this.logger.log(`Raw auth shops for ${shop.shopId}: ${JSON.stringify(authData)}`);
            const cipher = authData.shops[0].shop_cipher || authData.shops[0].cipher;
            await this.prisma.shop.update({
              where: { id: shop.id },
              data: { shopCipher: cipher }
            });
            this.logger.log(`Updated cipher for ${shop.shopId}: ${cipher}`);
          }
        } catch (e: any) {
          this.logger.error(`Failed to fix cipher for ${shop.shopId}: ${e.message}`);
        }
      }
    }
    return { success: true };
  }

  @Get('check-db')
  async checkDb() {
    const activeShops = await this.prisma.shop.count({ where: { isActive: true } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const syncsToday = await this.prisma.larkRecord.count({
      where: { updatedAt: { gte: today } }
    });
    
    // Check all shops
    const allShops = await this.prisma.shop.findMany();

    return {
      activeShops,
      syncsToday,
      shops: allShops.map(s => ({ shopId: s.shopId, isActive: s.isActive, platform: s.platform, brand: s.brand }))
    };
  }

  @Get('dashboard-stats')
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
