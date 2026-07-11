import { Injectable, Logger } from '@nestjs/common';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { ShopeeApiClient } from '../shopee/shopee-api.client';
import { SyncEngineService } from '../sync/sync-engine.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { REQUEST_TYPES, SYNC_SOURCES } from '../../common/constants';
import { JtExpressClient } from '../jt-express/jt-express.client';
import { JtExpressMapper } from '../jt-express/jt-express.mapper';

@Injectable()
export class ReconcileService {
  private readonly logger = new Logger(ReconcileService.name);

  constructor(
    private readonly tiktokApi: TiktokApiClient,
    private readonly shopeeApi: ShopeeApiClient,
    private readonly syncEngine: SyncEngineService,
    private readonly larkBot: LarkBotService,
    private readonly prisma: PrismaService,
    private readonly jtClient: JtExpressClient,
    private readonly jtMapper: JtExpressMapper,
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
    const shopCode = shop.shopCode || null;
    const shopCipher = shop.shopCipher || '';
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    let pageToken: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await this.tiktokApi.getOrderList({
          shopId,
          shopCipher,
          updateTimeFrom: fromTimestamp,
          updateTimeTo: toTimestamp,
          pageSize: 50,
          pageToken,
        });

        const orders = (result.orders || []) as Record<string, unknown>[];

        if (orders.length > 0) {
          try {
            // Lọc ra các đơn Giao Hàng Thất Bại (Chặn tuyệt đối do BUYER hoặc SELLER hủy)
            const failedDeliveryOrders = orders.filter((o: any) => {
              const status = String(o.order_status || o.status || '');
              if (status !== 'CANCELLED') return false;

              const reason = String(o.cancel_reason || o.cancellation_reason || '').toUpperCase();
              const initiator = String(o.cancellation_initiator || o.cancel_initiator || '').toUpperCase();

              // Tuyệt đối không lấy đơn do người mua / người bán hủy
              if (initiator === 'BUYER' || reason.includes('BUYER')) return false;
              if (initiator === 'SELLER' || reason.includes('SELLER')) return false;

              // Giao hàng thất bại: initiator là LOGISTICS hoặc reason chứa DELIVERY / THẤT BẠI
              if (
                initiator === 'LOGISTICS' || 
                reason.includes('DELIVERY') || 
                reason.includes('FAIL') || 
                reason.includes('THẤT BẠI') || 
                reason.includes('GIAO GÓI HÀNG') ||
                (initiator === 'SYSTEM' && (reason.includes('GIAO') || reason.includes('DELIVERY')))
              ) {
                // Đánh dấu cờ riêng để normalizer nhận biết
                o._is_failed_delivery = true;
                return true;
              }

              return false;
            });

            if (failedDeliveryOrders.length > 0) {
              // Giai đoạn 3: Tích hợp J&T cho đơn giao thất bại
              for (const o of failedDeliveryOrders) {
                let trackingNum = String(o.tracking_number || '');
                if (!trackingNum && Array.isArray(o.package_list) && o.package_list.length > 0) {
                  trackingNum = String(o.package_list[0].tracking_number || '');
                }

                if (trackingNum) {
                  try {
                    const trace = await this.jtClient.trace(String(o.order_id || ''), [trackingNum]);
                    const mapped = this.jtMapper.mapTraceResponse(trace);
                    if (mapped.warehouseReceivedAt) {
                      o._jt_warehouse_received_at = mapped.warehouseReceivedAt;
                      o._jt_matched_event_name = mapped.matchedEventName;
                      this.logger.debug(`[J&T] Found warehouseReceivedAt=${mapped.warehouseReceivedAt} for order ${o.order_id}`);
                    }
                  } catch (e: any) {
                    this.logger.error(`[J&T] Error enriching order ${o.order_id}: ${e.message}`);
                  }
                }
              }
            }

            // Sync TẤT CẢ orders (bảo toàn luồng cũ), các đơn thất bại đã được inject flag ở trên
            const batchStats = await this.syncEngine.syncOrdersBatch(orders, { shopId: shop.shopId, brand, shopCode }, SYNC_SOURCES.CRON);
            stats.total += batchStats.total;
            stats.created += batchStats.created;
            stats.updated += batchStats.updated;
            stats.skipped += batchStats.skipped;
            stats.errors += batchStats.errors;
          } catch (error) {
            stats.errors += orders.length;
          }
        }

        pageToken = result.next_page_token;
        hasMore = !!pageToken && orders.length > 0;
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
    const shopCode = shop.shopCode || null;
    const shopCipher = shop.shopCipher || '';
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    let pageToken: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await this.tiktokApi.getReturnList({
          shopId,
          shopCipher,
          updateTimeFrom: fromTimestamp,
          updateTimeTo: toTimestamp,
          pageSize: 50,
          pageToken,
        });

        const returns = (result.returns || result.return_refunds || result.return_orders || []) as Record<
          string,
          unknown
        >[];

        if (returns.length > 0) {
          const grouped = new Map<string, Record<string, unknown>[]>();
          for (const ret of returns) {
            const type = this.detectRequestType(ret);
            if (!grouped.has(type)) grouped.set(type, []);
            grouped.get(type)!.push(ret);
          }
          
          for (const [type, items] of grouped.entries()) {
            try {
              const batchStats = await this.syncEngine.syncReturnsBatch(items, { shopId: shop.shopId, brand, shopCode }, type, SYNC_SOURCES.CRON);
              stats.total += batchStats.total;
              stats.created += batchStats.created;
              stats.updated += batchStats.updated;
              stats.skipped += batchStats.skipped;
              stats.errors += batchStats.errors;
            } catch (error) {
              stats.errors += items.length;
            }
          }
        }

        pageToken = result.next_page_token;
        hasMore = !!pageToken && returns.length > 0;
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
    const typeField = String(data.request_type || data.return_type || data.refund_type || data.reverse_type || data.type || '').toUpperCase();
    
    if (typeField === 'CANCEL' || typeField === 'CANCELLED') return REQUEST_TYPES.CANCEL;
    if (typeField === 'REFUND_ONLY' || typeField === 'REFUND') return REQUEST_TYPES.REFUND;
    if (typeField === 'RETURN_AND_REFUND' || typeField === 'RETURN') return REQUEST_TYPES.RETURN;
    if (typeField === 'COMPLAINT' || typeField === 'DISPUTE') return REQUEST_TYPES.COMPLAINT;

    if (data.cancel_id) return REQUEST_TYPES.CANCEL;
    if (data.refund_id) return REQUEST_TYPES.REFUND;
    if (data.dispute_id || data.is_dispute) return REQUEST_TYPES.COMPLAINT;
    
    return REQUEST_TYPES.RETURN;
  }

  /**
   * SHOPEE: Đối soát đơn hàng
   */
  async reconcileShopeeOrders(
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
      where: { shopId, platform: 'SHOPEE', isActive: true },
    });

    if (!shop) {
      this.logger.warn(`⚠️ Shop Shopee ${shopId} not found or inactive`);
      return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
    }

    const brand = shop.brand || 'UNKNOWN';
    const shopCode = shop.shopCode || null;
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      const orders = await this.shopeeApi.getUpdatedOrders(shopId, fromTimestamp, toTimestamp);

      if (orders.length > 0) {
        // Lọc ra các đơn Giao Hàng Thất Bại (Chặn tuyệt đối do BUYER hoặc SELLER hủy)
        const failedDeliveryOrders = orders.filter((o: any) => {
          const status = String(o.order_status || '').toUpperCase();
          if (status !== 'CANCELLED') return false;

          const cancelBy = String(o.cancel_by || o.cancelled_by || '').toUpperCase();
          const cancelReason = String(o.cancel_reason || '').toUpperCase();

          // Tuyệt đối không lấy đơn do người mua / người bán hủy
          if (cancelBy === 'BUYER' || cancelReason.includes('BUYER')) return false;
          if (cancelBy === 'SELLER' || cancelReason.includes('SELLER')) return false;

          // Giao hàng thất bại: cancelBy là LOGISTICS hoặc reason chứa DELIVERY / FAIL / UNSUCCESSFUL / RETURN
          if (
            cancelBy === 'LOGISTICS' ||
            cancelReason.includes('DELIVERY') ||
            cancelReason.includes('FAIL') ||
            cancelReason.includes('UNSUCCESSFUL') ||
            cancelReason.includes('RETURN') ||
            cancelReason.includes('LOGISTICS')
          ) {
            o._is_failed_delivery = true;
            return true;
          }

          return false;
        });

        if (failedDeliveryOrders.length > 0) {
          // Tối ưu Batch: Chuyển list orders sang format raw để sync_engine handle
          const formattedOrders = failedDeliveryOrders.map(o => ({
            ...o,
            _raw_platform: 'SHOPEE'
          }));

          // Giai đoạn 3: Tích hợp J&T cho đơn giao thất bại (Shopee)
          for (const o of formattedOrders) {
            const trackingNum = String(o.tracking_number || o.tracking_no || '');
            if (trackingNum) {
              try {
                const trace = await this.jtClient.trace(String(o.order_sn || o.order_id || ''), [trackingNum]);
                const mapped = this.jtMapper.mapTraceResponse(trace);
                if (mapped.warehouseReceivedAt) {
                  o._jt_warehouse_received_at = mapped.warehouseReceivedAt;
                  o._jt_matched_event_name = mapped.matchedEventName;
                  this.logger.debug(`[J&T] Found warehouseReceivedAt=${mapped.warehouseReceivedAt} for Shopee order ${o.order_sn || o.order_id}`);
                }
              } catch (e: any) {
                this.logger.error(`[J&T] Error enriching Shopee order ${o.order_sn || o.order_id}: ${e.message}`);
              }
            }
          }

          const batchStats = await this.syncEngine.syncOrdersBatch(formattedOrders, { shopId: shop.shopId, brand, shopCode, platform: 'SHOPEE' }, SYNC_SOURCES.CRON);
          
          stats.total += batchStats.total;
          stats.created += batchStats.created;
          stats.updated += batchStats.updated;
          stats.skipped += batchStats.skipped;
          stats.errors += batchStats.errors;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Reconcile Shopee orders failed: ${errorMessage}`);
      stats.errors++;
    }

    this.logger.log(`📊 Reconcile Shopee orders done for ${shopId}: total=${stats.total}`);
    return stats;
  }

  /**
   * SHOPEE: Đối soát Return/Refund
   */
  async reconcileShopeeReturns(
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
      where: { shopId, platform: 'SHOPEE', isActive: true },
    });

    if (!shop) return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    const brand = shop.brand || 'UNKNOWN';
    const shopCode = shop.shopCode || null;
    const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

    let pageNo = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await this.shopeeApi.getReturnList(shopId, fromTimestamp, toTimestamp, pageNo);
        const returns = result.return_list || [];

        if (returns.length > 0) {
           const detailedReturns = [];
           for (const ret of returns) {
             try {
               const detailResult = await this.shopeeApi.getReturnDetail(shopId, ret.return_sn);
               if (detailResult) {
                 detailedReturns.push(detailResult);
               } else {
                 detailedReturns.push(ret); // Fallback to list item if detail fails but returns empty
               }
             } catch (err) {
               this.logger.error(`❌ Failed to fetch return detail for ${ret.return_sn}: ${err instanceof Error ? err.message : 'Unknown'}`);
               detailedReturns.push(ret); // Fallback to list item if API throws error
             }
           }
           
           if (detailedReturns.length > 0) {
             const batchStats = await this.syncEngine.syncReturnsBatch(detailedReturns, { shopId: shop.shopId, brand, shopCode, platform: 'SHOPEE' }, REQUEST_TYPES.RETURN, SYNC_SOURCES.CRON);
             stats.total += batchStats.total;
             stats.created += batchStats.created;
             stats.updated += batchStats.updated;
             stats.skipped += batchStats.skipped;
             stats.errors += batchStats.errors;
           }
        }

        hasMore = result.more;
        pageNo++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Reconcile Shopee returns failed: ${errorMessage}`);
        hasMore = false;
        stats.errors++;
      }
    }

    this.logger.log(`📊 Reconcile Shopee returns done for ${shopId}: total=${stats.total}`);
    return stats;
  }
}
