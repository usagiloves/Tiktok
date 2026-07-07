import { Injectable, Logger } from '@nestjs/common';
import { PLATFORMS, REQUEST_TYPES } from '../../common/constants';
import { StatusMapperService } from './status-mapper.service';

export interface NormalizedData {
  syncKey: string;
  platform: string;
  shopId: string;
  brand: string;
  orderId: string;
  requestId: string | null;
  requestType: string;
  internalStatus: string;
  isComplaint: boolean;
  orderCreatedAt: Date | null;
  warehouseReceivedAt: Date | null;
  lastTiktokUpdateTime: Date | null;
  systemNote: string;
  larkFields: Record<string, unknown>;
}

@Injectable()
export class NormalizerService {
  private readonly logger = new Logger(NormalizerService.name);

  constructor(private readonly statusMapper: StatusMapperService) {}

  // ============================================
  // Utility
  // ============================================

  /**
   * Format Date thành dạng string chuẩn của Lark (YYYY/MM/DD HH:mm) theo giờ VN
   */
  private formatLarkDateTime(date: Date | null): string {
    if (!date) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}`;
  }

  // ============================================
  // Tạo sync_key chống trùng
  // ============================================

  /**
   * sync_key = platform + shop_id + brand + order_id + request_type + request_id
   */
  private buildSyncKey(params: {
    platform: string;
    shopId: string;
    brand: string;
    orderId: string;
    requestType: string;
    requestId?: string | null;
  }): string {
    const parts = [
      params.platform,
      params.shopId,
      params.brand,
      params.orderId,
      params.requestType,
      params.requestId || 'ONLY',
    ];
    return parts.join('_');
  }

  // ============================================
  // Normalize Order Data
  // ============================================

  /**
   * Chuyển đổi dữ liệu đơn hàng TikTok → format chuẩn nội bộ.
   */
  normalizeOrder(
    rawOrder: Record<string, unknown>,
    shopId: string,
    brand: string,
  ): NormalizedData {
    const orderId = String(rawOrder.order_id || rawOrder.id || '');
    const tiktokStatus = String(rawOrder.order_status || rawOrder.status || '');
    const internalStatus = this.statusMapper.mapOrderStatus(tiktokStatus);
    const isComplaint = this.statusMapper.isComplaint(rawOrder);

    const orderCreatedAt = rawOrder.create_time
      ? new Date(Number(rawOrder.create_time) * 1000)
      : null;

    const lastUpdateTime = rawOrder.update_time
      ? new Date(Number(rawOrder.update_time) * 1000)
      : new Date();

    const syncKey = this.buildSyncKey({
      platform: PLATFORMS.TIKTOK,
      shopId,
      brand,
      orderId,
      requestType: REQUEST_TYPES.ORDER,
    });

    const systemNote = `Đơn hàng ${orderId}. Trạng thái: ${internalStatus}`;

    return {
      syncKey,
      platform: PLATFORMS.TIKTOK,
      shopId,
      brand,
      orderId,
      requestId: null,
      requestType: REQUEST_TYPES.ORDER,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt: null,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields: {
        'Ngày về kho': '',
        'Kênh bán': 'TikTok',
        'Thương hiệu': brand,
        'Ngày tạo đơn': this.formatLarkDateTime(orderCreatedAt),
        'Mã đơn gốc': orderId,
        'Mã đơn trả': '',
        'Loại yêu cầu': this.statusMapper.mapRequestType(REQUEST_TYPES.ORDER),
        'Tình trạng xử lý': internalStatus,
        'Khiếu nại': isComplaint ? 'Có' : 'Không',
        'Ghi chú hệ thống': systemNote,
        sync_key: syncKey,
        platform: PLATFORMS.TIKTOK,
        shop_id: shopId,
        request_id: '',
        last_tiktok_update_time: lastUpdateTime.getTime(),
        last_synced_at: Date.now(),
        sync_status: 'SUCCESS',
        sync_error: '',
      },
    };
  }

  // ============================================
  // Normalize Return/Refund Data
  // ============================================

  /**
   * Chuyển đổi dữ liệu hoàn/trả TikTok → format chuẩn nội bộ.
   */
  normalizeReturn(
    rawReturn: Record<string, unknown>,
    shopId: string,
    brand: string,
    requestType: string = REQUEST_TYPES.RETURN,
  ): NormalizedData {
    const orderId = String(rawReturn.order_id || '');
    const requestId = String(
      rawReturn.reverse_order_id ||
        rawReturn.return_id ||
        rawReturn.refund_id ||
        rawReturn.cancel_id ||
        '',
    );
    const tiktokStatus = String(
      rawReturn.reverse_order_status ||
        rawReturn.return_status ||
        rawReturn.status ||
        '',
    );
    const internalStatus = this.statusMapper.mapReturnStatus(tiktokStatus);
    const isComplaint = this.statusMapper.isComplaint(rawReturn);

    const orderCreatedAt = rawReturn.order_create_time
      ? new Date(Number(rawReturn.order_create_time) * 1000)
      : null;

    // "Ngày về kho" lấy từ TikTok (theo yêu cầu user)
    const warehouseReceivedAt = rawReturn.warehouse_receive_time
      ? new Date(Number(rawReturn.warehouse_receive_time) * 1000)
      : rawReturn.receive_time
        ? new Date(Number(rawReturn.receive_time) * 1000)
        : null;

    const lastUpdateTime = rawReturn.update_time
      ? new Date(Number(rawReturn.update_time) * 1000)
      : new Date();

    const syncKey = this.buildSyncKey({
      platform: PLATFORMS.TIKTOK,
      shopId,
      brand,
      orderId,
      requestType,
      requestId,
    });

    const typeLabel = this.statusMapper.mapRequestType(requestType);
    const systemNote = requestId
      ? `${typeLabel}: ${requestId}. Trạng thái: ${internalStatus}`
      : `${typeLabel} đơn ${orderId}. Trạng thái: ${internalStatus}`;

    return {
      syncKey,
      platform: PLATFORMS.TIKTOK,
      shopId,
      brand,
      orderId,
      requestId,
      requestType,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields: {
        'Ngày về kho': this.formatLarkDateTime(warehouseReceivedAt),
        'Kênh bán': 'TikTok',
        'Thương hiệu': brand,
        'Ngày tạo đơn': this.formatLarkDateTime(orderCreatedAt),
        'Mã đơn gốc': orderId,
        'Mã đơn trả': requestId,
        'Loại yêu cầu': typeLabel,
        'Tình trạng xử lý': internalStatus,
        'Khiếu nại': isComplaint ? 'Có' : 'Không',
        'Ghi chú hệ thống': systemNote,
        sync_key: syncKey,
        platform: PLATFORMS.TIKTOK,
        shop_id: shopId,
        request_id: requestId,
        last_tiktok_update_time: lastUpdateTime.getTime(),
        last_synced_at: Date.now(),
        sync_status: 'SUCCESS',
        sync_error: '',
      },
    };
  }
}
