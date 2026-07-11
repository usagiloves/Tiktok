"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusMapperService = void 0;
var common_1 = require("@nestjs/common");
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
var RETURN_STATUS_NORMALIZE = {
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
var ORDER_STATUS_MAP = {
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
var SHOPEE_ORDER_STATUS_MAP = {
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
var RETURN_STATUS_MAP = {
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
var SHOPEE_RETURN_STATUS_MAP = {
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
var REQUEST_TYPE_MAP = {
    ORDER: '', // Mấy mục ko quét được thì để trống
    RETURN_AND_REFUND: 'Đơn THHT',
    RETURN: 'Đơn THHT',
    REFUND_ONLY: 'Hoàn tiền',
    REFUND: 'Hoàn tiền',
    CANCELLED: 'Đơn hủy',
    CANCEL: 'Đơn hủy',
    COMPLAINT: 'Khiếu nại',
};
var StatusMapperService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var StatusMapperService = _classThis = /** @class */ (function () {
        function StatusMapperService_1() {
            this.logger = new common_1.Logger(StatusMapperService.name);
        }
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
        StatusMapperService_1.prototype.normalizeReturnStatusCode = function (rawStatus) {
            var upper = (rawStatus === null || rawStatus === void 0 ? void 0 : rawStatus.toUpperCase().replace(/\s+/g, '_')) || '';
            return RETURN_STATUS_NORMALIZE[upper] || upper;
        };
        // ============================================
        // Map trạng thái Order
        // ============================================
        /**
         * Map trạng thái đơn hàng TikTok → trạng thái nội bộ.
         */
        StatusMapperService_1.prototype.mapOrderStatus = function (tiktokStatus) {
            var normalized = tiktokStatus === null || tiktokStatus === void 0 ? void 0 : tiktokStatus.toUpperCase().replace(/\s+/g, '_');
            var mapped = ORDER_STATUS_MAP[normalized];
            if (!mapped) {
                this.logger.warn("\u26A0\uFE0F Unknown order status: rawStatus=\"".concat(tiktokStatus, "\" \u2192 fallback=\"\u0110ang x\u1EED l\u00FD\""));
                return 'Đang xử lý';
            }
            return mapped;
        };
        // ============================================
        // Map trạng thái Return/Refund (2 bước)
        // ============================================
        /**
         * Map trạng thái hoàn/trả TikTok → trạng thái nội bộ.
         * Sử dụng 2 bước: normalize → map.
         */
        StatusMapperService_1.prototype.mapReturnStatus = function (tiktokStatus) {
            var normalizedCode = this.normalizeReturnStatusCode(tiktokStatus);
            var mapped = RETURN_STATUS_MAP[normalizedCode];
            if (!mapped) {
                // TODO: Đổi fallback thành 'Chưa phân loại' sau khi đã thêm option trên Lark
                // Tạm dùng 'Cần kiểm tra' để tránh lỗi select option trên Lark
                this.logger.warn("\u26A0\uFE0F UNMAPPED return status: rawStatus=\"".concat(tiktokStatus, "\", normalizedCode=\"").concat(normalizedCode, "\" \u2192 fallback=\"C\u1EA7n ki\u1EC3m tra\""));
                return 'Cần kiểm tra';
            }
            return mapped;
        };
        // ============================================
        // Map loại yêu cầu
        // ============================================
        /**
         * Map loại yêu cầu → tên hiển thị tiếng Việt.
         */
        StatusMapperService_1.prototype.mapRequestType = function (requestType) {
            return REQUEST_TYPE_MAP[requestType === null || requestType === void 0 ? void 0 : requestType.toUpperCase()] || requestType;
        };
        /**
         * Kiểm tra đơn có phải khiếu nại không.
         */
        StatusMapperService_1.prototype.isComplaint = function (tiktokData) {
            // Kiểm tra các field thường liên quan đến complaint/dispute
            return !!(tiktokData.is_dispute ||
                tiktokData.dispute_status ||
                tiktokData.complaint_id);
        };
        /**
         * Map trạng thái đơn hàng Shopee → trạng thái nội bộ.
         */
        StatusMapperService_1.prototype.mapShopeeOrderStatus = function (shopeeStatus) {
            var normalized = shopeeStatus === null || shopeeStatus === void 0 ? void 0 : shopeeStatus.toUpperCase().replace(/\s+/g, '_');
            var mapped = SHOPEE_ORDER_STATUS_MAP[normalized];
            if (!mapped) {
                this.logger.warn("\u26A0\uFE0F Unknown Shopee order status: rawStatus=\"".concat(shopeeStatus, "\" \u2192 fallback=\"\u0110ang x\u1EED l\u00FD\""));
                return 'Đang xử lý';
            }
            return mapped;
        };
        /**
         * Map trạng thái hoàn/trả Shopee → trạng thái nội bộ.
         */
        StatusMapperService_1.prototype.mapShopeeReturnStatus = function (shopeeStatus) {
            var normalized = shopeeStatus === null || shopeeStatus === void 0 ? void 0 : shopeeStatus.toUpperCase().replace(/\s+/g, '_');
            var mapped = SHOPEE_RETURN_STATUS_MAP[normalized];
            if (!mapped) {
                this.logger.warn("\u26A0\uFE0F UNMAPPED Shopee return status: rawStatus=\"".concat(shopeeStatus, "\" \u2192 fallback=\"C\u1EA7n ki\u1EC3m tra\""));
                return 'Cần kiểm tra';
            }
            return mapped;
        };
        return StatusMapperService_1;
    }());
    __setFunctionName(_classThis, "StatusMapperService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StatusMapperService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StatusMapperService = _classThis;
}();
exports.StatusMapperService = StatusMapperService;
