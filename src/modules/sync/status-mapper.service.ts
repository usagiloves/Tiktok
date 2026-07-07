import { Injectable, Logger } from '@nestjs/common';

/**
 * Mapping trạng thái TikTok → trạng thái nội bộ.
 * Cấu hình tập trung, dễ thay đổi mà không sửa logic code.
 *
 * Trạng thái nội bộ hiện tại của team:
 * - Chưa về kho
 * - Hoàn Tất
 * - Thất lạc/Trả hàng
 * - Chưa làm hoàn
 *
 * LƯU Ý: Hệ thống KHÔNG tự chuyển sang "Hoàn Tất" (team kho xử lý).
 */

// ============================================
// Mapping trạng thái đơn hàng
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
// Mapping trạng thái hoàn/trả
// ============================================
const RETURN_STATUS_MAP: Record<string, string> = {
  // TikTok return/refund statuses
  RETURN_REQUESTED: 'Chưa về kho',
  SELLER_REVIEWING: 'Chưa về kho',
  BUYER_SHIPPED: 'Chưa về kho',
  RETURN_IN_TRANSIT: 'Chưa về kho',
  WAREHOUSE_RECEIVED: 'Chưa làm hoàn',
  REFUND_SUCCESS: 'Chưa làm hoàn', // KHÔNG tự "Hoàn Tất"
  REQUEST_REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',

  // Alternative naming conventions from TikTok
  PENDING: 'Chưa về kho',
  PROCESSING: 'Chưa về kho',
  SHIPPED_BACK: 'Chưa về kho',
  RECEIVED: 'Chưa làm hoàn',
  APPROVED: 'Chưa làm hoàn',
  REJECTED: 'Từ chối',
};

// ============================================
// Mapping loại yêu cầu
// ============================================
const REQUEST_TYPE_MAP: Record<string, string> = {
  ORDER: 'Đơn hàng',
  RETURN: 'Hoàn hàng',
  REFUND: 'Hoàn tiền',
  CANCEL: 'Hủy đơn',
  COMPLAINT: 'Khiếu nại',
};

@Injectable()
export class StatusMapperService {
  private readonly logger = new Logger(StatusMapperService.name);

  /**
   * Map trạng thái đơn hàng TikTok → trạng thái nội bộ.
   */
  mapOrderStatus(tiktokStatus: string): string {
    const normalized = tiktokStatus?.toUpperCase().replace(/\s+/g, '_');
    const mapped = ORDER_STATUS_MAP[normalized];

    if (!mapped) {
      this.logger.warn(
        `⚠️ Unknown order status: "${tiktokStatus}" → defaulting to "Đang xử lý"`,
      );
      return 'Đang xử lý';
    }

    return mapped;
  }

  /**
   * Map trạng thái hoàn/trả TikTok → trạng thái nội bộ.
   */
  mapReturnStatus(tiktokStatus: string): string {
    const normalized = tiktokStatus?.toUpperCase().replace(/\s+/g, '_');
    const mapped = RETURN_STATUS_MAP[normalized];

    if (!mapped) {
      this.logger.warn(
        `⚠️ Unknown return status: "${tiktokStatus}" → defaulting to "Chưa về kho"`,
      );
      return 'Chưa về kho';
    }

    return mapped;
  }

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
}
