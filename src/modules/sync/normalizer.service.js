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
exports.NormalizerService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../common/constants");
var NormalizerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var NormalizerService = _classThis = /** @class */ (function () {
        function NormalizerService_1(statusMapper) {
            this.statusMapper = statusMapper;
            this.logger = new common_1.Logger(NormalizerService.name);
        }
        // ============================================
        // Utility
        // ============================================
        /**
         * Format Date thành dạng string chuẩn của Lark (YYYY/MM/DD HH:mm) theo giờ VN
         */
        NormalizerService_1.prototype.formatLarkDateTime = function (date) {
            if (!date)
                return '';
            var parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).formatToParts(date);
            var values = Object.fromEntries(parts.map(function (part) { return [part.type, part.value]; }));
            return "".concat(values.year, "/").concat(values.month, "/").concat(values.day, " ").concat(values.hour, ":").concat(values.minute);
        };
        // ============================================
        // Tạo sync_key chống trùng
        // ============================================
        /**
         * sync_key = platform + shop_id + brand + order_id + request_type + request_id
         */
        NormalizerService_1.prototype.buildSyncKey = function (params) {
            var parts = [
                params.platform,
                params.shopId,
                params.brand,
                params.orderId,
                params.requestType,
                params.requestId || 'ONLY',
            ];
            return parts.join('_');
        };
        // ============================================
        // Extract line_items metadata (package/display status)
        // ============================================
        NormalizerService_1.prototype.extractLineItemStatuses = function (rawOrder) {
            var lineItems = rawOrder.line_items;
            if (!Array.isArray(lineItems)) {
                return { rawDisplayStatuses: [], rawPackageStatuses: [] };
            }
            var displayStatuses = new Set();
            var packageStatuses = new Set();
            for (var _i = 0, lineItems_1 = lineItems; _i < lineItems_1.length; _i++) {
                var item = lineItems_1[_i];
                if (item.display_status)
                    displayStatuses.add(String(item.display_status));
                if (item.package_status)
                    packageStatuses.add(String(item.package_status));
            }
            return {
                rawDisplayStatuses: Array.from(displayStatuses),
                rawPackageStatuses: Array.from(packageStatuses),
            };
        };
        // ============================================
        // Normalize Order Data
        // ============================================
        NormalizerService_1.prototype.normalizeOrder = function (rawOrder, shopMeta) {
            var orderId = String(rawOrder.order_id || rawOrder.id || '');
            var rawOrderStatus = String(rawOrder.order_status || rawOrder.status || '');
            var internalStatus = this.statusMapper.mapOrderStatus(rawOrderStatus);
            var isComplaint = this.statusMapper.isComplaint(rawOrder);
            var orderCreatedAt = rawOrder.create_time
                ? new Date(Number(rawOrder.create_time) * 1000)
                : null;
            var lastUpdateTime = rawOrder.update_time
                ? new Date(Number(rawOrder.update_time) * 1000)
                : new Date();
            var syncKey = this.buildSyncKey({
                platform: constants_1.PLATFORMS.TIKTOK,
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestType: constants_1.REQUEST_TYPES.ORDER,
            });
            var _a = this.extractLineItemStatuses(rawOrder), rawDisplayStatuses = _a.rawDisplayStatuses, rawPackageStatuses = _a.rawPackageStatuses;
            var systemNote = "\u0110\u01A1n h\u00E0ng ".concat(orderId, ". Tr\u1EA1ng th\u00E1i: ").concat(internalStatus);
            var isCancelled = rawOrderStatus === 'CANCELLED';
            if (isCancelled) {
                var cancelReason = String(rawOrder.cancel_reason || rawOrder.cancellation_reason || '');
                var cancelInitiator = String(rawOrder.cancellation_initiator || rawOrder.cancel_initiator || '');
                if (cancelInitiator || cancelReason) {
                    var parts = [];
                    if (cancelInitiator)
                        parts.push("H\u1EE7y b\u1EDFi ".concat(cancelInitiator));
                    if (cancelReason)
                        parts.push(cancelReason);
                    systemNote += ". ".concat(parts.join(' - '));
                }
            }
            var larkFields = {
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
            if (rawOrder._is_failed_delivery) {
                larkFields['Loại yêu cầu'] = 'Giao hàng thất bại';
            }
            else if (isCancelled) {
                larkFields['Loại yêu cầu'] = 'Đơn huỷ';
            }
            larkFields['_raw_order_status'] = rawOrderStatus;
            larkFields['_raw_display_statuses'] = rawDisplayStatuses;
            larkFields['_raw_package_statuses'] = rawPackageStatuses;
            larkFields['_raw_system_note'] = systemNote;
            larkFields['_raw_is_complaint'] = isComplaint;
            return {
                syncKey: syncKey,
                platform: constants_1.PLATFORMS.TIKTOK,
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestId: null,
                requestType: constants_1.REQUEST_TYPES.ORDER,
                internalStatus: internalStatus,
                isComplaint: isComplaint,
                orderCreatedAt: orderCreatedAt,
                warehouseReceivedAt: null,
                lastTiktokUpdateTime: lastUpdateTime,
                systemNote: systemNote,
                larkFields: larkFields,
            };
        };
        // ============================================
        // Normalize Return/Refund Data
        // ============================================
        NormalizerService_1.prototype.normalizeReturn = function (rawReturn, shopMeta, requestType) {
            if (requestType === void 0) { requestType = constants_1.REQUEST_TYPES.RETURN; }
            this.logger.debug("Raw Return: ".concat(JSON.stringify(rawReturn)));
            var orderId = String(rawReturn.order_id || '');
            var requestId = String(rawReturn.reverse_order_id ||
                rawReturn.return_id ||
                rawReturn.refund_id ||
                rawReturn.cancel_id ||
                '');
            var rawReturnStatus = String(rawReturn.reverse_order_status ||
                rawReturn.return_status ||
                rawReturn.refund_status ||
                rawReturn.status ||
                '');
            var internalStatus = this.statusMapper.mapReturnStatus(rawReturnStatus);
            var isComplaint = this.statusMapper.isComplaint(rawReturn);
            var orderCreatedAt = rawReturn.order_create_time
                ? new Date(Number(rawReturn.order_create_time) * 1000)
                : rawReturn.create_time
                    ? new Date(Number(rawReturn.create_time) * 1000)
                    : null;
            var warehouseReceivedAt = rawReturn.warehouse_receive_time
                ? new Date(Number(rawReturn.warehouse_receive_time) * 1000)
                : rawReturn.receive_time
                    ? new Date(Number(rawReturn.receive_time) * 1000)
                    : rawReturn.return_completed_time
                        ? new Date(Number(rawReturn.return_completed_time) * 1000)
                        : rawReturn.completed_time
                            ? new Date(Number(rawReturn.completed_time) * 1000)
                            : null;
            var lastUpdateTime = rawReturn.update_time
                ? new Date(Number(rawReturn.update_time) * 1000)
                : new Date();
            var syncKey = this.buildSyncKey({
                platform: constants_1.PLATFORMS.TIKTOK,
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestType: requestType,
                requestId: requestId,
            });
            var typeLabel = this.statusMapper.mapRequestType(requestType);
            var systemNote = requestId
                ? "".concat(typeLabel, ": ").concat(requestId, ". Tr\u1EA1ng th\u00E1i: ").concat(internalStatus)
                : "".concat(typeLabel, " \u0111\u01A1n ").concat(orderId, ". Tr\u1EA1ng th\u00E1i: ").concat(internalStatus);
            var returnReason = String(rawReturn.return_reason_text || rawReturn.cancel_reason || '');
            if (returnReason) {
                systemNote += ". L\u00FD do: ".concat(returnReason);
            }
            var refundTotal = 0;
            if (rawReturn.refund_amount && typeof rawReturn.refund_amount === 'object') {
                refundTotal = Number(rawReturn.refund_amount.refund_total || 0);
            }
            var larkFields = {
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
            else if (internalStatus === 'Cần kiểm tra' && lastUpdateTime) {
                // Gán Ngày về kho = ngày cuối cùng TikTok cắt API hành trình (đối với tất cả đơn bị khuyết)
                larkFields['Ngày về kho'] = this.formatLarkDateTime(lastUpdateTime);
            }
            if (orderCreatedAt) {
                larkFields['Ngày tạo đơn'] = this.formatLarkDateTime(orderCreatedAt);
            }
            if (typeLabel) {
                larkFields['Loại yêu cầu'] = typeLabel;
            }
            var normalizedCode = this.statusMapper.normalizeReturnStatusCode(rawReturnStatus);
            larkFields['_raw_return_status'] = rawReturnStatus;
            larkFields['_raw_normalized_code'] = normalizedCode;
            larkFields['_raw_return_reason'] = returnReason;
            larkFields['_raw_return_type'] = String(rawReturn.return_type || rawReturn.refund_type || '');
            larkFields['_raw_system_note'] = systemNote;
            larkFields['_raw_is_complaint'] = isComplaint;
            return {
                syncKey: syncKey,
                platform: constants_1.PLATFORMS.TIKTOK,
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestId: requestId,
                requestType: requestType,
                internalStatus: internalStatus,
                isComplaint: isComplaint,
                orderCreatedAt: orderCreatedAt,
                warehouseReceivedAt: warehouseReceivedAt,
                lastTiktokUpdateTime: lastUpdateTime,
                systemNote: systemNote,
                larkFields: larkFields,
            };
        };
        // ============================================
        // Normalize Shopee Data
        // ============================================
        NormalizerService_1.prototype.normalizeShopeeOrder = function (rawOrder, shopMeta) {
            var orderId = String(rawOrder.order_sn || '');
            var rawOrderStatus = String(rawOrder.order_status || '');
            var internalStatus = this.statusMapper.mapShopeeOrderStatus(rawOrderStatus);
            var isComplaint = false; // Shopee complaint tracking requires return API
            var orderCreatedAt = rawOrder.create_time
                ? new Date(Number(rawOrder.create_time) * 1000)
                : null;
            var lastUpdateTime = rawOrder.update_time
                ? new Date(Number(rawOrder.update_time) * 1000)
                : new Date();
            var syncKey = this.buildSyncKey({
                platform: 'SHOPEE',
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestType: constants_1.REQUEST_TYPES.ORDER,
            });
            var systemNote = "\u0110\u01A1n h\u00E0ng ".concat(orderId, ". Tr\u1EA1ng th\u00E1i: ").concat(internalStatus);
            var isCancelled = rawOrderStatus === 'CANCELLED';
            if (isCancelled) {
                var cancelReason = String(rawOrder.cancel_reason || '');
                var cancelBy = String(rawOrder.cancel_by || '');
                if (cancelBy || cancelReason) {
                    var parts = [];
                    if (cancelBy)
                        parts.push("H\u1EE7y b\u1EDFi ".concat(cancelBy));
                    if (cancelReason)
                        parts.push(cancelReason);
                    systemNote += ". ".concat(parts.join(' - '));
                }
            }
            var larkFields = {
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
            if (isCancelled) {
                larkFields['Loại yêu cầu'] = 'Đơn huỷ';
            }
            else {
                larkFields['Loại yêu cầu'] = 'Đơn hàng';
            }
            larkFields['_raw_order_status'] = rawOrderStatus;
            larkFields['_raw_system_note'] = systemNote;
            return {
                syncKey: syncKey,
                platform: 'SHOPEE',
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestId: null,
                requestType: constants_1.REQUEST_TYPES.ORDER,
                internalStatus: internalStatus,
                isComplaint: isComplaint,
                orderCreatedAt: orderCreatedAt,
                warehouseReceivedAt: null,
                lastTiktokUpdateTime: lastUpdateTime,
                systemNote: systemNote,
                larkFields: larkFields,
            };
        };
        NormalizerService_1.prototype.normalizeShopeeReturn = function (rawReturn, shopMeta) {
            var orderId = String(rawReturn.order_sn || '');
            var requestId = String(rawReturn.return_sn || '');
            var rawReturnStatus = String(rawReturn.status || '');
            var internalStatus = this.statusMapper.mapShopeeReturnStatus(rawReturnStatus);
            var isComplaint = rawReturnStatus === 'SELLER_DISPUTE';
            var orderCreatedAt = null; // Can be filled by SyncEngine later
            var lastUpdateTime = rawReturn.update_time
                ? new Date(Number(rawReturn.update_time) * 1000)
                : new Date();
            var syncKey = this.buildSyncKey({
                platform: 'SHOPEE',
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestType: constants_1.REQUEST_TYPES.RETURN,
                requestId: requestId,
            });
            var typeLabel = 'Đơn THHT';
            var systemNote = "".concat(typeLabel, ": ").concat(requestId, ". Tr\u1EA1ng th\u00E1i: ").concat(internalStatus);
            var reason = String(rawReturn.reason || rawReturn.text_reason || '');
            if (reason)
                systemNote += ". L\u00FD do: ".concat(reason);
            var larkFields = {
                'Kênh bán': 'Shopee',
                'Thương hiệu': [shopMeta.brand],
                'Mã đơn gốc': orderId,
                'Mã đơn trả': requestId,
                'Trạng thái/TH - HT': internalStatus,
                'sync_key': syncKey,
                'ID_SHOP': shopMeta.shopCode || shopMeta.shopId,
                'Loại yêu cầu': typeLabel,
            };
            if (internalStatus === 'Cần kiểm tra' && lastUpdateTime) {
                larkFields['Ngày về kho'] = this.formatLarkDateTime(lastUpdateTime);
            }
            larkFields['_raw_return_status'] = rawReturnStatus;
            larkFields['_raw_return_reason'] = reason;
            larkFields['_raw_system_note'] = systemNote;
            return {
                syncKey: syncKey,
                platform: 'SHOPEE',
                shopId: shopMeta.shopId,
                brand: shopMeta.brand,
                orderId: orderId,
                requestId: requestId,
                requestType: constants_1.REQUEST_TYPES.RETURN,
                internalStatus: internalStatus,
                isComplaint: isComplaint,
                orderCreatedAt: orderCreatedAt,
                warehouseReceivedAt: null, // Will use lastUpdateTime for 'Ngày về kho'
                lastTiktokUpdateTime: lastUpdateTime,
                systemNote: systemNote,
                larkFields: larkFields,
            };
        };
        return NormalizerService_1;
    }());
    __setFunctionName(_classThis, "NormalizerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NormalizerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NormalizerService = _classThis;
}();
exports.NormalizerService = NormalizerService;
