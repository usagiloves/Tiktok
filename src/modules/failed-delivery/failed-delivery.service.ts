import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { ShopeeApiClient } from '../shopee/shopee-api.client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../../common/constants';

@Injectable()
export class FailedDeliveryService {
  private readonly logger = new Logger(FailedDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tiktokApi: TiktokApiClient,
    private readonly shopeeApi: ShopeeApiClient,
    @InjectQueue(QUEUE_NAMES.SYNC_ORDER) private readonly syncQueue: Queue,
  ) {}

  async reconcilePendingFailedDeliveries() {
    this.logger.log('Starting reconcilePendingFailedDeliveries job...');

    // Lấy các đơn Giao Hàng Thất Bại đang pending (warehouseReceivedAt IS NULL)
    // Dựa vào cờ internalStatus = 'Đang hoàn' (chỉ đơn hoàn mới có trạng thái này)
    const pendingRequests = await this.prisma.normalizedRequest.findMany({
      where: {
        platform: { in: ['TIKTOK', 'SHOPEE'] },
        warehouseReceivedAt: null,
        internalStatus: 'Đang hoàn',
      },
    });

    if (pendingRequests.length === 0) {
      this.logger.log('No pending failed delivery orders found.');
      return;
    }

    // Nhóm theo shopId để dễ quản lý token
    const shopMap = new Map<string, any>();
    const shops = await this.prisma.shop.findMany({ where: { platform: { in: ['TIKTOK', 'SHOPEE'] }, isActive: true } });
    for (const shop of shops) {
      shopMap.set(shop.shopId, shop);
    }

    let successCount = 0;
    let softCutCount = 0;
    let hardCutCount = 0;

    // Tách riêng danh sách TIKTOK và SHOPEE
    const tiktokRequests = pendingRequests.filter((r: any) => r.platform === 'TIKTOK');
    const shopeeRequests = pendingRequests.filter((r: any) => r.platform === 'SHOPEE');

    // ============================================
    // 1. KIỂM TRA ĐƠN TIKTOK
    // ============================================
    for (const request of tiktokRequests) {
      const shop = shopMap.get(request.shopId);
      if (!shop || !shop.shopCipher) continue;

      try {
        const response = await this.tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, request.orderId);
        const order = response.orders?.[0];
        
        if (!order) continue;

        // Nếu trạng thái đổi thành COMPLETED -> SOFT CUT
        if (order.order_status === 'COMPLETED' || order.status === 'COMPLETED') {
          this.logger.log(`[Soft Cut] Order ${request.orderId} completed silently.`);
          
          // Gắn ngày về kho bằng update_time (mili-giây)
          const warehouseReceivedAtMs = order.update_time 
            ? Number(order.update_time) * 1000 
            : Date.now();

          // Push vào Queue thay vì sync trực tiếp
          await this.syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
            orderId: request.orderId,
            shopId: shop.shopId,
            source: 'FAILED_DELIVERY_TRACKER',
            isFailedDelivery: true,
            warehouseReceivedAtMs,
          });
          softCutCount++;
        }
      } catch (error: any) {
        const msg = error.message || '';
        // Bắt lỗi Hard Cut (Order not found hoặc tương tự)
        if (msg.includes('105001') || msg.includes('not found') || msg.includes('Invalid status')) {
          this.logger.log(`[Hard Cut] Order ${request.orderId} cut off from API. Marking as received.`);
          
          // Push vào Queue xử lý (truyền cờ fake)
          await this.syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
            orderId: request.orderId,
            shopId: shop.shopId,
            source: 'FAILED_DELIVERY_TRACKER_HARDCUT',
            isFailedDelivery: true,
            warehouseReceivedAtMs: Date.now(),
            isHardCut: true,
          });
          hardCutCount++;
        } else {
          this.logger.error(`Error checking order ${request.orderId}: ${msg}`);
        }
      }
      
      successCount++;
    }

    // ============================================
    // 2. KIỂM TRA ĐƠN SHOPEE
    // ============================================
    // Shopee hỗ trợ fetch nhiều order_sn cùng lúc (max 50)
    const shopeeRequestsByShop = new Map<string, typeof shopeeRequests>();
    for (const req of shopeeRequests) {
      const list = shopeeRequestsByShop.get(req.shopId) || [];
      list.push(req);
      shopeeRequestsByShop.set(req.shopId, list);
    }

    for (const [shopId, requests] of shopeeRequestsByShop.entries()) {
      const shop = shopMap.get(shopId);
      if (!shop) continue;

      // Chia chunk 50 đơn
      for (let i = 0; i < requests.length; i += 50) {
        const chunk = requests.slice(i, i + 50);
        const orderSns = chunk.map((r: any) => r.orderId); // Shopee order_sn lưu ở orderId

        try {
          const orders = await this.shopeeApi.getOrderDetail(shopId, orderSns);
          for (const order of orders) {
            const req = chunk.find((r: any) => r.orderId === order.order_sn);
            if (!req) continue;

            const status = String(order.order_status || '').toUpperCase();
            // Nếu Shopee âm thầm chuyển sang COMPLETED
            if (status === 'COMPLETED') {
              this.logger.log(`[Shopee Soft Cut] Order ${req.orderId} completed silently.`);
              
              const warehouseReceivedAtMs = order.update_time 
                ? Number(order.update_time) * 1000 
                : Date.now();

              await this.syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
                orderId: req.orderId,
                shopId: shop.shopId,
                source: 'FAILED_DELIVERY_TRACKER_SHOPEE',
                isFailedDelivery: true,
                warehouseReceivedAtMs,
              });
              softCutCount++;
            }
          }
          successCount += chunk.length;
        } catch (error: any) {
          const msg = error.message || '';
          this.logger.error(`Error checking Shopee orders for shop ${shopId}: ${msg}`);
          // Shopee thường quăng lỗi cục bộ (auth, timeout), nếu lỗi liên quan API ta có thể add logic Hard Cut sau.
        }
      }
    }

    this.logger.log(`Finished tracking ${successCount} pending orders. Found ${softCutCount} Soft Cuts and ${hardCutCount} Hard Cuts.`);
  }
}
