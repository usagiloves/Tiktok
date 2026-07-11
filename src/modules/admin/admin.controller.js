"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.AdminController = void 0;
var common_1 = require("@nestjs/common");
var AdminController = function () {
    var _classDecorators = [(0, common_1.Controller)('admin')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _testOrder_decorators;
    var _pushTestOrder_decorators;
    var _retrySync_decorators;
    var _reconcileOrders_decorators;
    var _reconcileReturns_decorators;
    var _historicalSweep_decorators;
    var _dashboard_decorators;
    var _getDashboard_decorators;
    var AdminController = _classThis = /** @class */ (function () {
        function AdminController_1(syncEngine, reconcileService, prisma, tiktokApi) {
            this.syncEngine = (__runInitializers(this, _instanceExtraInitializers), syncEngine);
            this.reconcileService = reconcileService;
            this.prisma = prisma;
            this.tiktokApi = tiktokApi;
            this.logger = new common_1.Logger(AdminController.name);
        }
        AdminController_1.prototype.testOrder = function (orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, orderDetail, e_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } })];
                        case 1:
                            shop = _b.sent();
                            if (!shop) {
                                throw new Error('No active shop found');
                            }
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', orderId)];
                        case 3:
                            orderDetail = _b.sent();
                            return [2 /*return*/, orderDetail];
                        case 4:
                            e_1 = _b.sent();
                            return [2 /*return*/, {
                                    error: e_1.message,
                                    response: (_a = e_1.response) === null || _a === void 0 ? void 0 : _a.data
                                }];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        AdminController_1.prototype.pushTestOrder = function (orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var shop, orderDetail, order, e_2;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } })];
                        case 1:
                            shop = _b.sent();
                            if (!shop) {
                                throw new Error('No active shop found');
                            }
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 7, , 8]);
                            return [4 /*yield*/, this.tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', orderId)];
                        case 3:
                            orderDetail = _b.sent();
                            if (!(orderDetail.orders && orderDetail.orders.length > 0)) return [3 /*break*/, 5];
                            order = orderDetail.orders[0];
                            // Flag for normalizer
                            order._is_failed_delivery = true;
                            return [4 /*yield*/, this.syncEngine.syncOrdersBatch([order], { shopId: shop.shopId, brand: shop.brand || 'Goodfit', shopCode: shop.shopCode || null }, 'MANUAL')];
                        case 4:
                            _b.sent();
                            return [2 /*return*/, { success: true, message: "Pushed order ".concat(orderId, " to LarkBase successfully.") }];
                        case 5: return [2 /*return*/, { success: false, message: 'Order not found from TikTok API' }];
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            e_2 = _b.sent();
                            return [2 /*return*/, {
                                    error: e_2.message,
                                    response: (_a = e_2.response) === null || _a === void 0 ? void 0 : _a.data
                                }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        // ============================================
        // Manual Retry
        // ============================================
        /**
         * POST /admin/sync/retry
         * Retry sync cho một sync_key cụ thể.
         */
        AdminController_1.prototype.retrySync = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\uD83D\uDD04 Manual retry for: ".concat(body.sync_key));
                            return [4 /*yield*/, this.syncEngine.retrySyncBySyncKey(body.sync_key)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    action: result.action,
                                    sync_key: body.sync_key,
                                }];
                    }
                });
            });
        };
        // ============================================
        // Manual Reconcile
        // ============================================
        /**
         * POST /admin/reconcile/orders
         * Đối soát đơn hàng thủ công theo khoảng ngày.
         */
        AdminController_1.prototype.reconcileOrders = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var fromTimestamp, toTimestamp, stats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\uD83D\uDCCA Manual reconcile orders: shop=".concat(body.shop_id, ", from=").concat(body.from, ", to=").concat(body.to));
                            fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
                            toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);
                            return [4 /*yield*/, this.reconcileService.reconcileOrders(body.shop_id, fromTimestamp, toTimestamp)];
                        case 1:
                            stats = _a.sent();
                            return [2 /*return*/, { success: true, stats: stats }];
                    }
                });
            });
        };
        /**
         * POST /admin/reconcile/returns
         * Đối soát hoàn/trả thủ công.
         */
        AdminController_1.prototype.reconcileReturns = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var fromTimestamp, toTimestamp, stats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\uD83D\uDCCA Manual reconcile returns: shop=".concat(body.shop_id, ", from=").concat(body.from, ", to=").concat(body.to));
                            fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
                            toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);
                            return [4 /*yield*/, this.reconcileService.reconcileReturns(body.shop_id, fromTimestamp, toTimestamp)];
                        case 1:
                            stats = _a.sent();
                            return [2 /*return*/, { success: true, stats: stats }];
                    }
                });
            });
        };
        /**
         * POST /admin/reconcile/historical
         * Quét bù (Backlog Sweep) toàn bộ đơn hàng và hoàn trả từ một mốc thời gian cho TẤT CẢ các shop active.
         */
        AdminController_1.prototype.historicalSweep = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var fromTimestamp, nowTimestamp, shops, results, _i, shops_1, shop, orderStats, returnStats, currentTo, currentFrom, oStats, rStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\uD83D\uDCCA Manual Historical Sweep starting from ".concat(body.from, "..."));
                            fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
                            nowTimestamp = Math.floor(Date.now() / 1000);
                            return [4 /*yield*/, this.prisma.shop.findMany({ where: { isActive: true } })];
                        case 1:
                            shops = _a.sent();
                            results = [];
                            _i = 0, shops_1 = shops;
                            _a.label = 2;
                        case 2:
                            if (!(_i < shops_1.length)) return [3 /*break*/, 11];
                            shop = shops_1[_i];
                            this.logger.log("Sweeping shop ".concat(shop.shopName, " (").concat(shop.platform, ")"));
                            orderStats = void 0, returnStats = void 0;
                            if (!(shop.platform === 'TIKTOK')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.reconcileService.reconcileOrders(shop.shopId, fromTimestamp, nowTimestamp)];
                        case 3:
                            orderStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileReturns(shop.shopId, fromTimestamp, nowTimestamp)];
                        case 4:
                            returnStats = _a.sent();
                            return [3 /*break*/, 9];
                        case 5:
                            if (!(shop.platform === 'SHOPEE')) return [3 /*break*/, 9];
                            currentTo = nowTimestamp;
                            currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
                            orderStats = { total: 0, updated: 0, errors: 0 };
                            returnStats = { total: 0, updated: 0, errors: 0 };
                            _a.label = 6;
                        case 6:
                            if (!(currentTo > fromTimestamp)) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeOrders(shop.shopId, currentFrom, currentTo)];
                        case 7:
                            oStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeReturns(shop.shopId, currentFrom, currentTo)];
                        case 8:
                            rStats = _a.sent();
                            if (oStats) {
                                orderStats.total += oStats.total;
                                orderStats.updated += oStats.updated;
                                orderStats.errors += oStats.errors;
                            }
                            if (rStats) {
                                returnStats.total += rStats.total;
                                returnStats.updated += rStats.updated;
                                returnStats.errors += rStats.errors;
                            }
                            currentTo = currentFrom;
                            currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
                            return [3 /*break*/, 6];
                        case 9:
                            results.push({
                                shopId: shop.shopId,
                                platform: shop.platform,
                                orders: orderStats,
                                returns: returnStats
                            });
                            _a.label = 10;
                        case 10:
                            _i++;
                            return [3 /*break*/, 2];
                        case 11:
                            this.logger.log("\u2705 Historical Sweep completed.");
                            return [2 /*return*/, { success: true, results: results }];
                    }
                });
            });
        };
        // ============================================
        // Dashboard
        // ============================================
        /**
         * GET /admin/dashboard
         * Dashboard sức khỏe hệ thống.
         */
        AdminController_1.prototype.dashboard = function () {
            return __awaiter(this, void 0, void 0, function () {
                var activeShops, today, syncsToday, allShops;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shop.count({ where: { isActive: true } })];
                        case 1:
                            activeShops = _a.sent();
                            today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return [4 /*yield*/, this.prisma.larkRecord.count({
                                    where: { updatedAt: { gte: today } }
                                })];
                        case 2:
                            syncsToday = _a.sent();
                            return [4 /*yield*/, this.prisma.shop.findMany()];
                        case 3:
                            allShops = _a.sent();
                            return [2 /*return*/, {
                                    activeShops: activeShops,
                                    syncsToday: syncsToday,
                                    shops: allShops.map(function (s) { return ({ shopId: s.shopId, isActive: s.isActive, platform: s.platform, brand: s.brand }); })
                                }];
                    }
                });
            });
        };
        AdminController_1.prototype.getDashboard = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, todayStart, _a, totalSyncToday, failedSyncToday, shops, tokens, tokenStatuses, recentErrors;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            now = new Date();
                            todayStart = new Date(now);
                            todayStart.setHours(0, 0, 0, 0);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.syncLog.count({
                                        where: { createdAt: { gte: todayStart } },
                                    }),
                                    this.prisma.syncLog.count({
                                        where: {
                                            createdAt: { gte: todayStart },
                                            status: 'FAILED',
                                        },
                                    }),
                                    this.prisma.shop.findMany({
                                        where: { isActive: true },
                                        select: { shopId: true, shopName: true, brand: true, platform: true },
                                    }),
                                    this.prisma.tiktokToken.findMany({
                                        select: {
                                            shopId: true,
                                            accessTokenExpiredAt: true,
                                            refreshTokenExpiredAt: true,
                                        },
                                    }),
                                ])];
                        case 1:
                            _a = _b.sent(), totalSyncToday = _a[0], failedSyncToday = _a[1], shops = _a[2], tokens = _a[3];
                            tokenStatuses = tokens.map(function (t) { return ({
                                shopId: t.shopId,
                                accessTokenValid: t.accessTokenExpiredAt ? t.accessTokenExpiredAt > now : false,
                                refreshTokenValid: t.refreshTokenExpiredAt ? t.refreshTokenExpiredAt > now : false,
                                accessTokenExpiresIn: t.accessTokenExpiredAt
                                    ? Math.round((t.accessTokenExpiredAt.getTime() - now.getTime()) / 1000 / 60)
                                    : 0,
                            }); });
                            return [4 /*yield*/, this.prisma.syncLog.findMany({
                                    where: { status: 'FAILED' },
                                    orderBy: { createdAt: 'desc' },
                                    take: 10,
                                    select: {
                                        traceId: true,
                                        syncKey: true,
                                        action: true,
                                        source: true,
                                        errorMessage: true,
                                        createdAt: true,
                                    },
                                })];
                        case 2:
                            recentErrors = _b.sent();
                            return [2 /*return*/, {
                                    status: 'ok',
                                    time: now.toISOString(),
                                    today: {
                                        totalSync: totalSyncToday,
                                        failedSync: failedSyncToday,
                                        successRate: totalSyncToday > 0
                                            ? "".concat((((totalSyncToday - failedSyncToday) / totalSyncToday) * 100).toFixed(1), "%")
                                            : 'N/A',
                                    },
                                    shops: shops,
                                    tokens: tokenStatuses,
                                    recentErrors: recentErrors,
                                }];
                    }
                });
            });
        };
        return AdminController_1;
    }());
    __setFunctionName(_classThis, "AdminController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _testOrder_decorators = [(0, common_1.Get)('test-order/:id')];
        _pushTestOrder_decorators = [(0, common_1.Post)('test-order/push/:id')];
        _retrySync_decorators = [(0, common_1.Post)('sync/retry')];
        _reconcileOrders_decorators = [(0, common_1.Post)('reconcile/orders')];
        _reconcileReturns_decorators = [(0, common_1.Post)('reconcile/returns')];
        _historicalSweep_decorators = [(0, common_1.Post)('reconcile/historical')];
        _dashboard_decorators = [(0, common_1.Get)('dashboard')];
        _getDashboard_decorators = [(0, common_1.Get)('dashboard-stats')];
        __esDecorate(_classThis, null, _testOrder_decorators, { kind: "method", name: "testOrder", static: false, private: false, access: { has: function (obj) { return "testOrder" in obj; }, get: function (obj) { return obj.testOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _pushTestOrder_decorators, { kind: "method", name: "pushTestOrder", static: false, private: false, access: { has: function (obj) { return "pushTestOrder" in obj; }, get: function (obj) { return obj.pushTestOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _retrySync_decorators, { kind: "method", name: "retrySync", static: false, private: false, access: { has: function (obj) { return "retrySync" in obj; }, get: function (obj) { return obj.retrySync; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reconcileOrders_decorators, { kind: "method", name: "reconcileOrders", static: false, private: false, access: { has: function (obj) { return "reconcileOrders" in obj; }, get: function (obj) { return obj.reconcileOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reconcileReturns_decorators, { kind: "method", name: "reconcileReturns", static: false, private: false, access: { has: function (obj) { return "reconcileReturns" in obj; }, get: function (obj) { return obj.reconcileReturns; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _historicalSweep_decorators, { kind: "method", name: "historicalSweep", static: false, private: false, access: { has: function (obj) { return "historicalSweep" in obj; }, get: function (obj) { return obj.historicalSweep; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _dashboard_decorators, { kind: "method", name: "dashboard", static: false, private: false, access: { has: function (obj) { return "dashboard" in obj; }, get: function (obj) { return obj.dashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDashboard_decorators, { kind: "method", name: "getDashboard", static: false, private: false, access: { has: function (obj) { return "getDashboard" in obj; }, get: function (obj) { return obj.getDashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
}();
exports.AdminController = AdminController;
