import { Injectable, Logger } from '@nestjs/common';

/**
 * Mapping trạng thái TikTok → trạng thái nội bộ.
 * Cấu hình tập trung, dễ thay đổi mà không sửa logic code.
 *
 * Trạng thái nội bộ hiện tại của team:
 * - Chưa về kho
 * - Cần kiểm tra
 * - Từ chối
 * - Đã hủy
 * - Chưa phân loại (fallback cho status lạ)
 *
 * LƯU Ý: Hệ thống KHÔNG tự chuyển sang "Hoàn Tất" (team kho xử lý).
 */

// ============================================
// Bước 1: Chuẩn hoá raw status từ TikTok
// Gom các biến thể về 1 mã chuẩn duy nhất.
// ============================================
const RETURN_STATUS_NORMALIZE: Record<string, string> = {
  // Biến thể cancel
  RETURN_OR_REFUND_REQUEST_CANCEL: 'CANCELLED',
  RETURN_OR_REFUND_REQUEST_CANCELLED: 'CANCELLED',
  REQUEST_CANCELLED: 'CANCELLED',
  REFUND_CANCELLED: 'CANCELLED',

  // Biến thể reject
  RETURN_OR_REFUND_REQUEST_REJECT: 'REJECTED',
  RETURN_OR_REFUND_REQUEST_REJECTED: 'REJECTED',
  SELLER_REJECT: 'REJECTED',
  PLATFORM_REJECT: 'REJECTED',

  // Biến thể buyer shipped
  BUYER_SHIPPED_ITEM: 'BUYER_SHIPPED',

  // Biến thể complete/success
  RETURN_OR_REFUND_REQUEST_COMPLETE: 'REFUND_COMPLETE',
  RETURN_OR_REFUND_REQUEST_COMPLETED: 'REFUND_COMPLETE',
  REFUND_SUCCESS: 'REFUND_COMPLETE',
  REFUND_COMPLETED: 'REFUND_COMPLETE',

  // Biến thể received
  WAREHOUSE_RECEIVED: 'WAREHOUSE_RECEIVED',
  RECEIVED: 'WAREHOUSE_RECEIVED',
  APPROVED: 'WAREHOUSE_RECEIVED',

  // Biến thể in-transit
  RETURN_IN_TRANSIT: 'IN_TRANSIT',
  SHIPPED_BACK: 'IN_TRANSIT',
};

// ============================================
// Bước 2: Mapping trạng thái đơn hàng (Order)
// ============================================
const ORDER_STATUS_MAP: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  ON_HOLD: 'Đang giữ đơn',
  AWAITING_SHIPMENT: 'Chờ xử lý vận chuyển',
  AWAITING_COLLECTION: 'Chờ đơn vị vận chuyển lấy hàng',
  IN_TRANSIT: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Đã giao', // KHÔNG tự chuyển "Hoàn Tất" → team kho xử lý
  CANCELLED: 'Đã hủy',
};

// ============================================
// Mapping trạng thái đơn hàng (Shopee)
// ============================================
const SHOPEE_ORDER_STATUS_MAP: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  READY_TO_SHIP: 'Chờ xử lý vận chuyển',
  PROCESSED: 'Chờ xử lý vận chuyển',
  RETRY_SHIP: 'Chờ xử lý vận chuyển',
  SHIPPED: 'Đang giao',
  TO_CONFIRM_RECEIVE: 'Đang giao',
  IN_CANCEL: 'Đang giữ đơn',
  CANCELLED: 'Đã hủy',
  TO_RETURN: 'Cần kiểm tra',
  COMPLETED: 'Đã giao',
};

// ============================================
// Bước 2: Mapping trạng thái hoàn/trả (Return/Refund)
// Sử dụng mã đã chuẩn hoá từ Bước 1.
// ============================================
const RETURN_STATUS_MAP: Record<string, string> = {
  // Nhóm: Chưa về kho (hàng đang trên đường hoặc chưa gửi)
  RETURN_REQUESTED: 'Chưa về kho',
  SELLER_REVIEWING: 'Chưa về kho',
  AWAITING_BUYER_SHIP: 'Chưa về kho',
  BUYER_SHIPPED: 'Chưa về kho',
  IN_TRANSIT: 'Chưa về kho',
  PENDING: 'Chưa về kho',
  PROCESSING: 'Chưa về kho',

  // Nhóm: Cần kiểm tra (hàng đã về kho hoặc đã hoàn tiền)
  WAREHOUSE_RECEIVED: 'Cần kiểm tra',
  REFUND_COMPLETE: 'Cần kiểm tra',

  // Nhóm: Từ chối
  REJECTED: 'Từ chối',
  REQUEST_REJECTED: 'Từ chối',

  // Nhóm: Đã hủy
  CANCELLED: 'Đã hủy',
};

// ============================================
// Mapping trạng thái hoàn/trả (Shopee)
// ============================================
const SHOPEE_RETURN_STATUS_MAP: Record<string, string> = {
  REQUESTED: 'Chưa về kho',
  ACCEPTED: 'Chưa về kho',
  CANCELLED: 'Đã hủy',
  JUDGING: 'Chưa về kho',
  REFUND_PAID: 'Cần kiểm tra',
  CLOSED: 'Cần kiểm tra',
  PROCESSING: 'Chưa về kho',
  SELLER_DISPUTE: 'Cần kiểm tra',
};

// ============================================
// Mapping loại yêu cầu
// ============================================
const REQUEST_TYPE_MAP: Record<string, string> = {
  ORDER: '', // Mấy mục ko quét được thì để trống
  RETURN_AND_REFUND: 'Đơn THHT',
  RETURN: 'Đơn THHT',
  REFUND_ONLY: 'Hoàn tiền',
  REFUND: 'Hoàn tiền',
  CANCELLED: 'Đơn hủy',
  CANCEL: 'Đơn hủy',
  COMPLAINT: 'Khiếu nại',
};

@Injectable()
export class StatusMapperService {
  private readonly logger = new Logger(StatusMapperService.name);

  // ============================================
  // Chuẩn hoá raw return status
  // ============================================

  /**
   * Chuẩn hoá raw return status code từ TikTok về mã nội bộ.
   * Ví dụ: RETURN_OR_REFUND_REQUEST_CANCEL → CANCELLED
   *         BUYER_SHIPPED_ITEM → BUYER_SHIPPED
   *
   * Nếu không có trong bảng normalize, giữ nguyên (đã uppercase).
   */
  normalizeReturnStatusCode(rawStatus: string): string {
    const upper = rawStatus?.toUpperCase().replace(/\s+/g, '_') || '';
    return RETURN_STATUS_NORMALIZE[upper] || upper;
  }

  // ============================================
  // Map trạng thái Order
  // ============================================

  /**
   * Map trạng thái đơn hàng TikTok → trạng thái nội bộ.
   */
  mapOrderStatus(tiktokStatus: string): string {
    const normalized = tiktokStatus?.toUpperCase().replace(/\s+/g, '_');
    const mapped = ORDER_STATUS_MAP[normalized];

    if (!mapped) {
      this.logger.warn(
        `⚠️ Unknown order status: rawStatus="${tiktokStatus}" → fallback="Đang xử lý"`,
      );
      return 'Đang xử lý';
    }

    return mapped;
  }

  // ============================================
  // Map trạng thái Return/Refund (2 bước)
  // ============================================

  /**
   * Map trạng thái hoàn/trả TikTok → trạng thái nội bộ.
   * Sử dụng 2 bước: normalize → map.
   */
  mapReturnStatus(tiktokStatus: string): string {
    const normalizedCode = this.normalizeReturnStatusCode(tiktokStatus);
    const mapped = RETURN_STATUS_MAP[normalizedCode];

    if (!mapped) {
      // TODO: Đổi fallback thành 'Chưa phân loại' sau khi đã thêm option trên Lark
      // Tạm dùng 'Cần kiểm tra' để tránh lỗi select option trên Lark
      this.logger.warn(
        `⚠️ UNMAPPED return status: rawStatus="${tiktokStatus}", normalizedCode="${normalizedCode}" → fallback="Cần kiểm tra"`,
      );
      return 'Cần kiểm tra';
    }

    return mapped;
  }

  // ============================================
  // Map loại yêu cầu
  // ============================================

  /**
   * Map loại yêu cầu → tên hiển thị tiếng Việt.
   */
  mapRequestType(requestType: string): string {
    return REQUEST_TYPE_MAP[requestType?.toUpperCase()] || requestType;
  }

  /**
   * Kiểm tra đơn có phải khiếu nại không.
   */
  isComplaint(tiktokData: Record<string, unknown>): boolean {
    // Kiểm tra các field thường liên quan đến complaint/dispute
    return !!(
      tiktokData.is_dispute ||
      tiktokData.dispute_status ||
      tiktokData.complaint_id
    );
  }

  /**
   * Map trạng thái đơn hàng Shopee → trạng thái nội bộ.
   */
  mapShopeeOrderStatus(shopeeStatus: string): string {
    const normalized = shopeeStatus?.toUpperCase().replace(/\s+/g, '_');
    const mapped = SHOPEE_ORDER_STATUS_MAP[normalized];

    if (!mapped) {
      this.logger.warn(
        `⚠️ Unknown Shopee order status: rawStatus="${shopeeStatus}" → fallback="Đang xử lý"`,
      );
      return 'Đang xử lý';
    }

    return mapped;
  }

  /**
   * Map trạng thái hoàn/trả Shopee → trạng thái nội bộ.
   */
  mapShopeeReturnStatus(shopeeStatus: string): string {
    const normalized = shopeeStatus?.toUpperCase().replace(/\s+/g, '_');
    const mapped = SHOPEE_RETURN_STATUS_MAP[normalized];

    if (!mapped) {
      this.logger.warn(
        `⚠️ UNMAPPED Shopee return status: rawStatus="${shopeeStatus}" → fallback="Cần kiểm tra"`,
      );
      return 'Cần kiểm tra';
    }

    return mapped;
  }
}
