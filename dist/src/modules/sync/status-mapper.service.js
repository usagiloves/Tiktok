"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StatusMapperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusMapperService = void 0;
const common_1 = require("@nestjs/common");
const ORDER_STATUS_MAP = {
    UNPAID: 'Chưa thanh toán',
    ON_HOLD: 'Đang giữ đơn',
    AWAITING_SHIPMENT: 'Chờ xử lý vận chuyển',
    AWAITING_COLLECTION: 'Chờ đơn vị vận chuyển lấy hàng',
    IN_TRANSIT: 'Đang giao',
    DELIVERED: 'Đã giao',
    COMPLETED: 'Đã giao',
    CANCELLED: 'Đã hủy',
};
const RETURN_STATUS_MAP = {
    RETURN_REQUESTED: 'Chưa về kho',
    SELLER_REVIEWING: 'Chưa về kho',
    BUYER_SHIPPED: 'Chưa về kho',
    RETURN_IN_TRANSIT: 'Chưa về kho',
    WAREHOUSE_RECEIVED: 'Chưa làm hoàn',
    REFUND_SUCCESS: 'Chưa làm hoàn',
    REQUEST_REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    PENDING: 'Chưa về kho',
    PROCESSING: 'Chưa về kho',
    SHIPPED_BACK: 'Chưa về kho',
    RECEIVED: 'Chưa làm hoàn',
    APPROVED: 'Chưa làm hoàn',
    REJECTED: 'Từ chối',
};
const REQUEST_TYPE_MAP = {
    ORDER: 'Đơn hàng',
    RETURN: 'Hoàn hàng',
    REFUND: 'Hoàn tiền',
    CANCEL: 'Hủy đơn',
    COMPLAINT: 'Khiếu nại',
};
let StatusMapperService = StatusMapperService_1 = class StatusMapperService {
    logger = new common_1.Logger(StatusMapperService_1.name);
    mapOrderStatus(tiktokStatus) {
        const normalized = tiktokStatus?.toUpperCase().replace(/\s+/g, '_');
        const mapped = ORDER_STATUS_MAP[normalized];
        if (!mapped) {
            this.logger.warn(`⚠️ Unknown order status: "${tiktokStatus}" → defaulting to "Đang xử lý"`);
            return 'Đang xử lý';
        }
        return mapped;
    }
    mapReturnStatus(tiktokStatus) {
        const normalized = tiktokStatus?.toUpperCase().replace(/\s+/g, '_');
        const mapped = RETURN_STATUS_MAP[normalized];
        if (!mapped) {
            this.logger.warn(`⚠️ Unknown return status: "${tiktokStatus}" → defaulting to "Chưa về kho"`);
            return 'Chưa về kho';
        }
        return mapped;
    }
    mapRequestType(requestType) {
        return REQUEST_TYPE_MAP[requestType?.toUpperCase()] || requestType;
    }
    isComplaint(tiktokData) {
        return !!(tiktokData.is_dispute ||
            tiktokData.dispute_status ||
            tiktokData.complaint_id);
    }
};
exports.StatusMapperService = StatusMapperService;
exports.StatusMapperService = StatusMapperService = StatusMapperService_1 = __decorate([
    (0, common_1.Injectable)()
], StatusMapperService);
//# sourceMappingURL=status-mapper.service.js.map