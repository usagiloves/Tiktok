"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NormalizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizerService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../common/constants");
const status_mapper_service_1 = require("./status-mapper.service");
let NormalizerService = NormalizerService_1 = class NormalizerService {
    statusMapper;
    logger = new common_1.Logger(NormalizerService_1.name);
    constructor(statusMapper) {
        this.statusMapper = statusMapper;
    }
    formatLarkDateTime(date) {
        if (!date)
            return '';
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}`;
    }
    buildSyncKey(params) {
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
    normalizeOrder(rawOrder, shopId, brand) {
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
            platform: constants_1.PLATFORMS.TIKTOK,
            shopId,
            brand,
            orderId,
            requestType: constants_1.REQUEST_TYPES.ORDER,
        });
        const systemNote = `Đơn hàng ${orderId}. Trạng thái: ${internalStatus}`;
        return {
            syncKey,
            platform: constants_1.PLATFORMS.TIKTOK,
            shopId,
            brand,
            orderId,
            requestId: null,
            requestType: constants_1.REQUEST_TYPES.ORDER,
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
                'Loại yêu cầu': this.statusMapper.mapRequestType(constants_1.REQUEST_TYPES.ORDER),
                'Tình trạng xử lý': internalStatus,
                'Khiếu nại': isComplaint ? 'Có' : 'Không',
                'Ghi chú hệ thống': systemNote,
                sync_key: syncKey,
                platform: constants_1.PLATFORMS.TIKTOK,
                shop_id: shopId,
                request_id: '',
                last_tiktok_update_time: lastUpdateTime.getTime(),
                last_synced_at: Date.now(),
                sync_status: 'SUCCESS',
                sync_error: '',
            },
        };
    }
    normalizeReturn(rawReturn, shopId, brand, requestType = constants_1.REQUEST_TYPES.RETURN) {
        const orderId = String(rawReturn.order_id || '');
        const requestId = String(rawReturn.reverse_order_id ||
            rawReturn.return_id ||
            rawReturn.refund_id ||
            rawReturn.cancel_id ||
            '');
        const tiktokStatus = String(rawReturn.reverse_order_status ||
            rawReturn.return_status ||
            rawReturn.status ||
            '');
        const internalStatus = this.statusMapper.mapReturnStatus(tiktokStatus);
        const isComplaint = this.statusMapper.isComplaint(rawReturn);
        const orderCreatedAt = rawReturn.order_create_time
            ? new Date(Number(rawReturn.order_create_time) * 1000)
            : null;
        const warehouseReceivedAt = rawReturn.warehouse_receive_time
            ? new Date(Number(rawReturn.warehouse_receive_time) * 1000)
            : rawReturn.receive_time
                ? new Date(Number(rawReturn.receive_time) * 1000)
                : null;
        const lastUpdateTime = rawReturn.update_time
            ? new Date(Number(rawReturn.update_time) * 1000)
            : new Date();
        const syncKey = this.buildSyncKey({
            platform: constants_1.PLATFORMS.TIKTOK,
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
            platform: constants_1.PLATFORMS.TIKTOK,
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
                platform: constants_1.PLATFORMS.TIKTOK,
                shop_id: shopId,
                request_id: requestId,
                last_tiktok_update_time: lastUpdateTime.getTime(),
                last_synced_at: Date.now(),
                sync_status: 'SUCCESS',
                sync_error: '',
            },
        };
    }
};
exports.NormalizerService = NormalizerService;
exports.NormalizerService = NormalizerService = NormalizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [status_mapper_service_1.StatusMapperService])
], NormalizerService);
//# sourceMappingURL=normalizer.service.js.map