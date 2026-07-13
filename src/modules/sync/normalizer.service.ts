import { Injectable, Logger } from '@nestjs/common';
import { PLATFORMS, REQUEST_TYPES } from '../../common/constants';
import { StatusMapperService } from './status-mapper.service';

export interface ShopMeta {
  shopId: string;
  brand: string;
  shopCode?: string | null;
  platform?: string;
}

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
  public formatLarkDateTime(date: Date | null | undefined): string {
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
  // Extract line_items metadata (package/display status)
  // ============================================

  private extractLineItemStatuses(rawOrder: Record<string, unknown>): {
    rawDisplayStatuses: string[];
    rawPackageStatuses: string[];
  } {
    const lineItems = rawOrder.line_items as any[] | undefined;
    if (!Array.isArray(lineItems)) {
      return { rawDisplayStatuses: [], rawPackageStatuses: [] };
    }

    const displayStatuses = new Set<string>();
    const packageStatuses = new Set<string>();

    for (const item of lineItems) {
      if (item.display_status) displayStatuses.add(String(item.display_status));
      if (item.package_status) packageStatuses.add(String(item.package_status));
    }

    return {
      rawDisplayStatuses: Array.from(displayStatuses),
      rawPackageStatuses: Array.from(packageStatuses),
    };
  }

  // ============================================
  // Normalize Order Data
  // ============================================

  normalizeOrder(
    rawOrder: Record<string, unknown>,
    shopMeta: ShopMeta,
  ): NormalizedData {
    const orderId = String(rawOrder.order_id || rawOrder.id || '');
    const rawOrderStatus = String(rawOrder.order_status || rawOrder.status || '');
    let internalStatus = this.statusMapper.mapOrderStatus(rawOrderStatus);
    const isComplaint = this.statusMapper.isComplaint(rawOrder);

    const orderCreatedAt = rawOrder.create_time
      ? new Date(Number(rawOrder.create_time) * 1000)
      : null;

    const lastUpdateTime = rawOrder.update_time
      ? new Date(Number(rawOrder.update_time) * 1000)
      : new Date();

    const syncKey = this.buildSyncKey({
      platform: PLATFORMS.TIKTOK,
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestType: REQUEST_TYPES.ORDER,
    });

    const { rawDisplayStatuses, rawPackageStatuses } =
      this.extractLineItemStatuses(rawOrder);

    let systemNote = `Đơn hàng ${orderId}. Trạng thái: ${internalStatus}`;

    const isCancelled = rawOrderStatus === 'CANCELLED';
    if (isCancelled) {
      const cancelReason = String(
        rawOrder.cancel_reason || rawOrder.cancellation_reason || '',
      );
      const cancelInitiator = String(
        rawOrder.cancellation_initiator || rawOrder.cancel_initiator || '',
      );
      if (cancelInitiator || cancelReason) {
        const parts: string[] = [];
        if (cancelInitiator) parts.push(`Hủy bởi ${cancelInitiator}`);
        if (cancelReason) parts.push(cancelReason);
        systemNote += `. ${parts.join(' - ')}`;
      }
    }

    const larkFields: any = {
      'Kênh bán': 'TikTok',
      'Thương hiệu': [shopMeta.brand],
      'Mã đơn gốc': orderId,
      'Trạng thái/TH - HT': internalStatus,
      'sync_key': syncKey,
      'ID_SHOP': shopMeta.shopCode || shopMeta.shopId,
    };
    
    if (orderCreatedAt) {
      larkFields['Ngày tạo đơn'] = this.formatLarkDateTime(orderCreatedAt);
    }

    let warehouseReceivedAt: Date | null = null;
    if (rawOrder._jt_warehouse_received_at) {
      warehouseReceivedAt = new Date(rawOrder._jt_warehouse_received_at as string);
    } else if (rawOrder._is_failed_delivery && (rawOrder.order_status === 'COMPLETED' || rawOrder.status === 'COMPLETED')) {
      const updateTimeMs = rawOrder.update_time ? Number(rawOrder.update_time) * 1000 : Date.now();
      warehouseReceivedAt = new Date(updateTimeMs);
    }

    if (rawOrder._is_failed_delivery) {
      larkFields['Loại yêu cầu'] = 'Giao hàng thất bại';
      // Giai đoạn 3: Tích hợp logic J&T cho Đơn Giao Hàng Thất Bại
      if (warehouseReceivedAt) {
        internalStatus = 'Đã về kho';
      } else {
        internalStatus = 'Đang hoàn';
      }
      larkFields['Trạng thái/TH - HT'] = internalStatus;
    } else if (isCancelled) {
      larkFields['Loại yêu cầu'] = 'Đơn huỷ';
    }

    if (warehouseReceivedAt) {
      larkFields['Ngày về kho'] = this.formatLarkDateTime(warehouseReceivedAt);
    }

    larkFields['_raw_order_status'] = rawOrderStatus;
    larkFields['_raw_display_statuses'] = rawDisplayStatuses;
    larkFields['_raw_package_statuses'] = rawPackageStatuses;
    larkFields['_raw_system_note'] = systemNote;
    larkFields['_raw_is_complaint'] = isComplaint;
    if (rawOrder._jt_matched_event_name) {
      larkFields['_raw_jt_matched_event_name'] = rawOrder._jt_matched_event_name;
    }

    return {
      syncKey,
      platform: PLATFORMS.TIKTOK,
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestId: null,
      requestType: REQUEST_TYPES.ORDER,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields,
    };
  }

  // ============================================
  // Normalize Return/Refund Data
  // ============================================

  normalizeReturn(
    rawReturn: Record<string, unknown>,
    shopMeta: ShopMeta,
    requestType: string = REQUEST_TYPES.RETURN,
  ): NormalizedData {
    this.logger.debug(`Raw Return: ${JSON.stringify(rawReturn)}`);
    const orderId = String(rawReturn.order_id || '');
    const requestId = String(
      rawReturn.reverse_order_id ||
        rawReturn.return_id ||
        rawReturn.refund_id ||
        rawReturn.cancel_id ||
        '',
    );
    const rawReturnStatus = String(
      rawReturn.reverse_order_status ||
        rawReturn.return_status ||
        rawReturn.refund_status ||
        rawReturn.status ||
        '',
    );
    const internalStatus = this.statusMapper.mapReturnStatus(rawReturnStatus);
    const isComplaint = this.statusMapper.isComplaint(rawReturn);

    const orderCreatedAt = rawReturn.order_create_time
      ? new Date(Number(rawReturn.order_create_time) * 1000)
      : rawReturn.create_time
        ? new Date(Number(rawReturn.create_time) * 1000)
        : null;

    let warehouseReceivedAt: Date | null = rawReturn.warehouse_receive_time
      ? new Date(Number(rawReturn.warehouse_receive_time) * 1000)
      : rawReturn.receive_time
        ? new Date(Number(rawReturn.receive_time) * 1000)
        : rawReturn.return_completed_time
          ? new Date(Number(rawReturn.return_completed_time) * 1000)
          : rawReturn.completed_time
            ? new Date(Number(rawReturn.completed_time) * 1000)
            : null;

    const lastUpdateTime = rawReturn.update_time
      ? new Date(Number(rawReturn.update_time) * 1000)
      : new Date();
      
    if (!warehouseReceivedAt && internalStatus === 'Cần kiểm tra' && lastUpdateTime) {
      warehouseReceivedAt = lastUpdateTime;
    }

    const syncKey = this.buildSyncKey({
      platform: PLATFORMS.TIKTOK,
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestType: requestType,
      requestId: requestId,
    });

    const typeLabel = this.statusMapper.mapRequestType(requestType);

    let systemNote = requestId
      ? `${typeLabel}: ${requestId}. Trạng thái: ${internalStatus}`
      : `${typeLabel} đơn ${orderId}. Trạng thái: ${internalStatus}`;

    const returnReason = String(
      rawReturn.return_reason_text || rawReturn.cancel_reason || '',
    );
    if (returnReason) {
      systemNote += `. Lý do: ${returnReason}`;
    }

    let refundTotal = 0;
    if (rawReturn.refund_amount && typeof rawReturn.refund_amount === 'object') {
      refundTotal = Number((rawReturn.refund_amount as any).refund_total || 0);
    }

    const larkFields: any = {
      'Kênh bán': 'TikTok',
      'Thương hiệu': [shopMeta.brand],
      'Mã đơn gốc': orderId,
      'Mã đơn trả': requestId,
      'Trạng thái/TH - HT': internalStatus,
      'sync_key': syncKey,
      'ID_SHOP': shopMeta.shopCode || shopMeta.shopId,
    };

    if (warehouseReceivedAt) {
      larkFields['Ngày về kho'] = this.formatLarkDateTime(warehouseReceivedAt);
    }

    if (orderCreatedAt) {
      larkFields['Ngày tạo đơn'] = this.formatLarkDateTime(orderCreatedAt);
    }

    if (typeLabel) {
      larkFields['Loại yêu cầu'] = typeLabel;
    }

    const normalizedCode = this.statusMapper.normalizeReturnStatusCode(rawReturnStatus);
    larkFields['_raw_return_status'] = rawReturnStatus;
    larkFields['_raw_normalized_code'] = normalizedCode;
    larkFields['_raw_return_reason'] = returnReason;
    larkFields['_raw_return_type'] = String(rawReturn.return_type || rawReturn.refund_type || '');
    larkFields['_raw_system_note'] = systemNote;
    larkFields['_raw_is_complaint'] = isComplaint;

    return {
      syncKey,
      platform: PLATFORMS.TIKTOK,
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestId,
      requestType,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields,
    };
  }

  // ============================================
  // Normalize Shopee Data
  // ============================================

  normalizeShopeeOrder(
    rawOrder: Record<string, unknown>,
    shopMeta: ShopMeta,
  ): NormalizedData {
    const orderId = String(rawOrder.order_sn || '');
    const rawOrderStatus = String(rawOrder.order_status || '');
    let internalStatus = this.statusMapper.mapShopeeOrderStatus(rawOrderStatus);
    const isComplaint = false; // Shopee complaint tracking requires return API

    const orderCreatedAt = rawOrder.create_time
      ? new Date(Number(rawOrder.create_time) * 1000)
      : null;

    const lastUpdateTime = rawOrder.update_time
      ? new Date(Number(rawOrder.update_time) * 1000)
      : new Date();

    const syncKey = this.buildSyncKey({
      platform: 'SHOPEE',
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestType: REQUEST_TYPES.ORDER,
    });

    let systemNote = `Đơn hàng ${orderId}. Trạng thái: ${internalStatus}`;

    const isCancelled = rawOrderStatus === 'CANCELLED';
    if (isCancelled) {
      const cancelReason = String(rawOrder.cancel_reason || '');
      const cancelBy = String(rawOrder.cancel_by || '');
      if (cancelBy || cancelReason) {
        const parts: string[] = [];
        if (cancelBy) parts.push(`Hủy bởi ${cancelBy}`);
        if (cancelReason) parts.push(cancelReason);
        systemNote += `. ${parts.join(' - ')}`;
      }
    }

    const larkFields: any = {
      'Kênh bán': 'Shopee',
      'Thương hiệu': [shopMeta.brand],
      'Mã đơn gốc': orderId,
      'Trạng thái/TH - HT': internalStatus,
      'sync_key': syncKey,
      'ID_SHOP': shopMeta.shopCode || shopMeta.shopId,
    };
    
    if (orderCreatedAt) {
      larkFields['Ngày tạo đơn'] = this.formatLarkDateTime(orderCreatedAt);
    }

    let warehouseReceivedAt: Date | null = null;
    if (rawOrder._jt_warehouse_received_at) {
      warehouseReceivedAt = new Date(rawOrder._jt_warehouse_received_at as string);
    } else if (rawOrder._is_failed_delivery && (rawOrder.order_status === 'COMPLETED' || rawOrder.status === 'COMPLETED')) {
      const updateTimeMs = rawOrder.update_time ? Number(rawOrder.update_time) * 1000 : Date.now();
      warehouseReceivedAt = new Date(updateTimeMs);
    }

    if (rawOrder._is_failed_delivery) {
      larkFields['Loại yêu cầu'] = 'Giao hàng thất bại';
      // Giai đoạn 3: Tích hợp logic J&T cho Đơn Giao Hàng Thất Bại
      if (warehouseReceivedAt) {
        internalStatus = 'Đã về kho';
      } else {
        internalStatus = 'Đang hoàn';
      }
      larkFields['Trạng thái/TH - HT'] = internalStatus;
    } else if (isCancelled) {
      larkFields['Loại yêu cầu'] = 'Đơn huỷ';
    } else {
      larkFields['Loại yêu cầu'] = 'Đơn hàng';
    }

    if (warehouseReceivedAt) {
      larkFields['Ngày về kho'] = this.formatLarkDateTime(warehouseReceivedAt);
    }

    larkFields['_raw_order_status'] = rawOrderStatus;
    larkFields['_raw_system_note'] = systemNote;
    if (rawOrder._jt_matched_event_name) {
      larkFields['_raw_jt_matched_event_name'] = rawOrder._jt_matched_event_name;
    }

    return {
      syncKey,
      platform: 'SHOPEE',
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestId: null,
      requestType: REQUEST_TYPES.ORDER,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields,
    };
  }

  normalizeShopeeReturn(
    rawReturn: Record<string, unknown>,
    shopMeta: ShopMeta,
  ): NormalizedData {
    const orderId = String(rawReturn.order_sn || '');
    const requestId = String(rawReturn.return_sn || '');
    const rawReturnStatus = String(rawReturn.status || '');
    const internalStatus = this.statusMapper.mapShopeeReturnStatus(rawReturnStatus);
    const isComplaint = rawReturnStatus === 'SELLER_DISPUTE';

    const orderCreatedAt = null; // Can be filled by SyncEngine later

    const lastUpdateTime = rawReturn.update_time
      ? new Date(Number(rawReturn.update_time) * 1000)
      : new Date();

    let typeLabel = 'Hoàn tiền';
    if (rawReturn.needs_logistics === true || rawReturn.needs_logistics === 'true') {
      typeLabel = 'Đơn THHT';
    } else if (rawReturnStatus === 'CANCELLED') {
      typeLabel = 'Đơn huỷ';
    }

    const requestType = typeLabel === 'Hoàn tiền' ? REQUEST_TYPES.REFUND : (typeLabel === 'Đơn huỷ' ? REQUEST_TYPES.CANCEL : REQUEST_TYPES.RETURN);

    const syncKey = this.buildSyncKey({
      platform: 'SHOPEE',
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestType,
      requestId,
    });

    let systemNote = `${typeLabel}: ${requestId}. Trạng thái: ${internalStatus}`;

    const reason = String(rawReturn.reason || rawReturn.text_reason || '');
    if (reason) systemNote += `. Lý do: ${reason}`;

    let warehouseReceivedAt: Date | null = null;
    
    if (!warehouseReceivedAt && internalStatus === 'Cần kiểm tra' && lastUpdateTime) {
      warehouseReceivedAt = lastUpdateTime;
    }

    const larkFields: any = {
      'Kênh bán': 'Shopee',
      'Thương hiệu': [shopMeta.brand],
      'Mã đơn gốc': orderId,
      'Mã đơn trả': requestId,
      'Trạng thái/TH - HT': internalStatus,
      'sync_key': syncKey,
      'ID_SHOP': shopMeta.shopCode || shopMeta.shopId,
      'Loại yêu cầu': typeLabel,
    };

    if (warehouseReceivedAt) {
      larkFields['Ngày về kho'] = this.formatLarkDateTime(warehouseReceivedAt);
    }

    larkFields['_raw_return_status'] = rawReturnStatus;
    larkFields['_raw_return_reason'] = reason;
    larkFields['_raw_system_note'] = systemNote;

    return {
      syncKey,
      platform: 'SHOPEE',
      shopId: shopMeta.shopId,
      brand: shopMeta.brand,
      orderId,
      requestId,
      requestType,
      internalStatus,
      isComplaint,
      orderCreatedAt,
      warehouseReceivedAt,
      lastTiktokUpdateTime: lastUpdateTime,
      systemNote,
      larkFields,
    };
  }
}
