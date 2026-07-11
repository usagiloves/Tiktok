"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconcileService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../common/constants");
var ReconcileService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ReconcileService = _classThis = /** @class */ (function () {
        function ReconcileService_1(tiktokApi, shopeeApi, syncEngine, larkBot, prisma) {
            this.tiktokApi = tiktokApi;
            this.shopeeApi = shopeeApi;
            this.syncEngine = syncEngine;
            this.larkBot = larkBot;
            this.prisma = prisma;
            this.logger = new common_1.Logger(ReconcileService.name);
        }
        /**
         * Đối soát đơn hàng trong khoảng thời gian.
         * Kéo tất cả đơn thay đổi và sync lại.
         */
        ReconcileService_1.prototype.reconcileOrders = function (shopId, fromTimestamp, toTimestamp) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, brand, shopCode, shopCipher, stats, pageToken, hasMore, result, orders, failedDeliveryOrders, batchStats, error_1, error_2, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({
                                where: { shopId: shopId, platform: 'TIKTOK', isActive: true },
                            })];
                        case 1:
                            shop = _a.sent();
                            if (!shop) {
                                this.logger.warn("\u26A0\uFE0F Shop ".concat(shopId, " not found or inactive"));
                                return [2 /*return*/, { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }];
                            }
                            brand = shop.brand || 'UNKNOWN';
                            shopCode = shop.shopCode || null;
                            shopCipher = shop.shopCipher || '';
                            stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
                            hasMore = true;
                            _a.label = 2;
                        case 2:
                            if (!hasMore) return [3 /*break*/, 12];
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 10, , 11]);
                            return [4 /*yield*/, this.tiktokApi.getOrderList({
                                    shopId: shopId,
                                    shopCipher: shopCipher,
                                    updateTimeFrom: fromTimestamp,
                                    updateTimeTo: toTimestamp,
                                    pageSize: 50,
                                    pageToken: pageToken,
                                })];
                        case 4:
                            result = _a.sent();
                            orders = (result.orders || []);
                            if (!(orders.length > 0)) return [3 /*break*/, 9];
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 8, , 9]);
                            failedDeliveryOrders = orders.filter(function (o) {
                                var status = String(o.order_status || o.status || '');
                                if (status !== 'CANCELLED')
                                    return false;
                                var reason = String(o.cancel_reason || o.cancellation_reason || '').toUpperCase();
                                var initiator = String(o.cancellation_initiator || o.cancel_initiator || '').toUpperCase();
                                // Tuyệt đối không lấy đơn do người mua / người bán hủy
                                if (initiator === 'BUYER' || reason.includes('BUYER'))
                                    return false;
                                if (initiator === 'SELLER' || reason.includes('SELLER'))
                                    return false;
                                // Giao hàng thất bại: initiator là LOGISTICS hoặc reason chứa DELIVERY / THẤT BẠI
                                if (initiator === 'LOGISTICS' ||
                                    reason.includes('DELIVERY') ||
                                    reason.includes('FAIL') ||
                                    reason.includes('THẤT BẠI') ||
                                    reason.includes('GIAO GÓI HÀNG') ||
                                    (initiator === 'SYSTEM' && (reason.includes('GIAO') || reason.includes('DELIVERY')))) {
                                    // Đánh dấu cờ riêng để normalizer nhận biết
                                    o._is_failed_delivery = true;
                                    return true;
                                }
                                return false;
                            });
                            if (!(failedDeliveryOrders.length > 0)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.syncEngine.syncOrdersBatch(failedDeliveryOrders, { shopId: shop.shopId, brand: brand, shopCode: shopCode }, constants_1.SYNC_SOURCES.CRON)];
                        case 6:
                            batchStats = _a.sent();
                            stats.total += batchStats.total;
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            _a.label = 7;
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            error_1 = _a.sent();
                            stats.errors += orders.length;
                            return [3 /*break*/, 9];
                        case 9:
                            pageToken = result.next_page_token;
                            hasMore = !!pageToken && orders.length > 0;
                            return [3 /*break*/, 11];
                        case 10:
                            error_2 = _a.sent();
                            errorMessage = error_2 instanceof Error ? error_2.message : 'Unknown error';
                            this.logger.error("\u274C Reconcile orders failed: ".concat(errorMessage));
                            hasMore = false;
                            stats.errors++;
                            return [3 /*break*/, 11];
                        case 11: return [3 /*break*/, 2];
                        case 12:
                            this.logger.log("\uD83D\uDCCA Reconcile orders done: total=".concat(stats.total, ", created=").concat(stats.created, ", updated=").concat(stats.updated, ", skipped=").concat(stats.skipped, ", errors=").concat(stats.errors));
                            return [2 /*return*/, stats];
                    }
                });
            });
        };
        /**
         * Đối soát hoàn/trả/hủy trong khoảng thời gian.
         */
        ReconcileService_1.prototype.reconcileReturns = function (shopId, fromTimestamp, toTimestamp) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, brand, shopCode, shopCipher, stats, pageToken, hasMore, result, returns, grouped, _i, returns_1, ret, type, _a, _b, _c, type, items, batchStats, error_3, error_4, errorMessage;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({
                                where: { shopId: shopId, platform: 'TIKTOK', isActive: true },
                            })];
                        case 1:
                            shop = _d.sent();
                            if (!shop) {
                                return [2 /*return*/, { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }];
                            }
                            brand = shop.brand || 'UNKNOWN';
                            shopCode = shop.shopCode || null;
                            shopCipher = shop.shopCipher || '';
                            stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
                            hasMore = true;
                            _d.label = 2;
                        case 2:
                            if (!hasMore) return [3 /*break*/, 13];
                            _d.label = 3;
                        case 3:
                            _d.trys.push([3, 11, , 12]);
                            return [4 /*yield*/, this.tiktokApi.getReturnList({
                                    shopId: shopId,
                                    shopCipher: shopCipher,
                                    updateTimeFrom: fromTimestamp,
                                    updateTimeTo: toTimestamp,
                                    pageSize: 50,
                                    pageToken: pageToken,
                                })];
                        case 4:
                            result = _d.sent();
                            returns = (result.returns || result.return_refunds || result.return_orders || []);
                            if (!(returns.length > 0)) return [3 /*break*/, 10];
                            grouped = new Map();
                            for (_i = 0, returns_1 = returns; _i < returns_1.length; _i++) {
                                ret = returns_1[_i];
                                type = this.detectRequestType(ret);
                                if (!grouped.has(type))
                                    grouped.set(type, []);
                                grouped.get(type).push(ret);
                            }
                            _a = 0, _b = grouped.entries();
                            _d.label = 5;
                        case 5:
                            if (!(_a < _b.length)) return [3 /*break*/, 10];
                            _c = _b[_a], type = _c[0], items = _c[1];
                            _d.label = 6;
                        case 6:
                            _d.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.syncEngine.syncReturnsBatch(items, { shopId: shop.shopId, brand: brand, shopCode: shopCode }, type, constants_1.SYNC_SOURCES.CRON)];
                        case 7:
                            batchStats = _d.sent();
                            stats.total += batchStats.total;
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            return [3 /*break*/, 9];
                        case 8:
                            error_3 = _d.sent();
                            stats.errors += items.length;
                            return [3 /*break*/, 9];
                        case 9:
                            _a++;
                            return [3 /*break*/, 5];
                        case 10:
                            pageToken = result.next_page_token;
                            hasMore = !!pageToken && returns.length > 0;
                            return [3 /*break*/, 12];
                        case 11:
                            error_4 = _d.sent();
                            errorMessage = error_4 instanceof Error ? error_4.message : 'Unknown error';
                            this.logger.error("\u274C Reconcile returns failed: ".concat(errorMessage));
                            hasMore = false;
                            stats.errors++;
                            return [3 /*break*/, 12];
                        case 12: return [3 /*break*/, 2];
                        case 13:
                            this.logger.log("\uD83D\uDCCA Reconcile returns done: total=".concat(stats.total, ", created=").concat(stats.created, ", updated=").concat(stats.updated, ", skipped=").concat(stats.skipped, ", errors=").concat(stats.errors));
                            return [2 /*return*/, stats];
                    }
                });
            });
        };
        ReconcileService_1.prototype.detectRequestType = function (data) {
            var typeField = String(data.request_type || data.return_type || data.refund_type || data.reverse_type || data.type || '').toUpperCase();
            if (typeField === 'CANCEL' || typeField === 'CANCELLED')
                return constants_1.REQUEST_TYPES.CANCEL;
            if (typeField === 'REFUND_ONLY' || typeField === 'REFUND')
                return constants_1.REQUEST_TYPES.REFUND;
            if (typeField === 'RETURN_AND_REFUND' || typeField === 'RETURN')
                return constants_1.REQUEST_TYPES.RETURN;
            if (typeField === 'COMPLAINT' || typeField === 'DISPUTE')
                return constants_1.REQUEST_TYPES.COMPLAINT;
            if (data.cancel_id)
                return constants_1.REQUEST_TYPES.CANCEL;
            if (data.refund_id)
                return constants_1.REQUEST_TYPES.REFUND;
            if (data.dispute_id || data.is_dispute)
                return constants_1.REQUEST_TYPES.COMPLAINT;
            return constants_1.REQUEST_TYPES.RETURN;
        };
        /**
         * SHOPEE: Đối soát đơn hàng
         */
        ReconcileService_1.prototype.reconcileShopeeOrders = function (shopId, fromTimestamp, toTimestamp) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, brand, shopCode, stats, orders, formattedOrders, batchStats, error_5, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({
                                where: { shopId: shopId, platform: 'SHOPEE', isActive: true },
                            })];
                        case 1:
                            shop = _a.sent();
                            if (!shop) {
                                this.logger.warn("\u26A0\uFE0F Shop Shopee ".concat(shopId, " not found or inactive"));
                                return [2 /*return*/, { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }];
                            }
                            brand = shop.brand || 'UNKNOWN';
                            shopCode = shop.shopCode || null;
                            stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 6, , 7]);
                            return [4 /*yield*/, this.shopeeApi.getUpdatedOrders(shopId, fromTimestamp, toTimestamp)];
                        case 3:
                            orders = _a.sent();
                            if (!(orders.length > 0)) return [3 /*break*/, 5];
                            formattedOrders = orders.map(function (o) { return (__assign(__assign({}, o), { _raw_platform: 'SHOPEE' })); });
                            return [4 /*yield*/, this.syncEngine.syncOrdersBatch(formattedOrders, { shopId: shop.shopId, brand: brand, shopCode: shopCode }, constants_1.SYNC_SOURCES.CRON)];
                        case 4:
                            batchStats = _a.sent();
                            stats.total += batchStats.total;
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            error_5 = _a.sent();
                            errorMessage = error_5 instanceof Error ? error_5.message : 'Unknown error';
                            this.logger.error("\u274C Reconcile Shopee orders failed: ".concat(errorMessage));
                            stats.errors++;
                            return [3 /*break*/, 7];
                        case 7:
                            this.logger.log("\uD83D\uDCCA Reconcile Shopee orders done for ".concat(shopId, ": total=").concat(stats.total));
                            return [2 /*return*/, stats];
                    }
                });
            });
        };
        /**
         * SHOPEE: Đối soát Return/Refund
         */
        ReconcileService_1.prototype.reconcileShopeeReturns = function (shopId, fromTimestamp, toTimestamp) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, brand, shopCode, stats, cursor, hasMore, result, returns, batchStats, error_6, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({
                                where: { shopId: shopId, platform: 'SHOPEE', isActive: true },
                            })];
                        case 1:
                            shop = _a.sent();
                            if (!shop)
                                return [2 /*return*/, { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }];
                            brand = shop.brand || 'UNKNOWN';
                            shopCode = shop.shopCode || null;
                            stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
                            cursor = '';
                            hasMore = true;
                            _a.label = 2;
                        case 2:
                            if (!hasMore) return [3 /*break*/, 9];
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 7, , 8]);
                            return [4 /*yield*/, this.shopeeApi.getReturnList(shopId, fromTimestamp, toTimestamp, cursor)];
                        case 4:
                            result = _a.sent();
                            returns = result.return_list || [];
                            if (!(returns.length > 0)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.syncEngine.syncReturnsBatch(returns, { shopId: shop.shopId, brand: brand, shopCode: shopCode }, constants_1.REQUEST_TYPES.RETURN, constants_1.SYNC_SOURCES.CRON)];
                        case 5:
                            batchStats = _a.sent();
                            stats.total += batchStats.total;
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            _a.label = 6;
                        case 6:
                            hasMore = result.more;
                            cursor = result.next_cursor;
                            return [3 /*break*/, 8];
                        case 7:
                            error_6 = _a.sent();
                            errorMessage = error_6 instanceof Error ? error_6.message : 'Unknown error';
                            this.logger.error("\u274C Reconcile Shopee returns failed: ".concat(errorMessage));
                            hasMore = false;
                            stats.errors++;
                            return [3 /*break*/, 8];
                        case 8: return [3 /*break*/, 2];
                        case 9:
                            this.logger.log("\uD83D\uDCCA Reconcile Shopee returns done for ".concat(shopId, ": total=").concat(stats.total));
                            return [2 /*return*/, stats];
                    }
                });
            });
        };
        return ReconcileService_1;
    }());
    __setFunctionName(_classThis, "ReconcileService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReconcileService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReconcileService = _classThis;
}();
exports.ReconcileService = ReconcileService;
