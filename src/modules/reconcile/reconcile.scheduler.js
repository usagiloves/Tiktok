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
exports.ReconcileScheduler = void 0;
var common_1 = require("@nestjs/common");
var schedule_1 = require("@nestjs/schedule");
var ReconcileScheduler = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _reconcileNearRealtime_decorators;
    var _reconcileDailyBackfill_decorators;
    var _reconcileWeeklySafetySweep_decorators;
    var ReconcileScheduler = _classThis = /** @class */ (function () {
        function ReconcileScheduler_1(reconcileService, larkBot, prisma) {
            this.reconcileService = (__runInitializers(this, _instanceExtraInitializers), reconcileService);
            this.larkBot = larkBot;
            this.prisma = prisma;
            this.logger = new common_1.Logger(ReconcileScheduler.name);
        }
        /**
         * 1. Near Realtime: Mỗi 30 phút, quét 2 giờ gần nhất
         */
        ReconcileScheduler_1.prototype.reconcileNearRealtime = function () {
            return __awaiter(this, void 0, void 0, function () {
                var shops, stats, _i, shops_1, shop, now, twoHoursAgo, oStats, rStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('⏰ Cron: reconcileNearRealtime started');
                            return [4 /*yield*/, this.getActiveShops()];
                        case 1:
                            shops = _a.sent();
                            stats = { total: 0, created: 0, updated: 0, failed: 0 };
                            _i = 0, shops_1 = shops;
                            _a.label = 2;
                        case 2:
                            if (!(_i < shops_1.length)) return [3 /*break*/, 10];
                            shop = shops_1[_i];
                            now = Math.floor(Date.now() / 1000);
                            twoHoursAgo = now - 2 * 60 * 60;
                            oStats = void 0, rStats = void 0;
                            if (!(shop.platform === 'TIKTOK')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.reconcileService.reconcileReturns(shop.shopId, twoHoursAgo, now)];
                        case 3:
                            rStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileOrders(shop.shopId, twoHoursAgo, now)];
                        case 4:
                            oStats = _a.sent();
                            return [3 /*break*/, 8];
                        case 5:
                            if (!(shop.platform === 'SHOPEE')) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeReturns(shop.shopId, twoHoursAgo, now)];
                        case 6:
                            rStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeOrders(shop.shopId, twoHoursAgo, now)];
                        case 7:
                            oStats = _a.sent();
                            _a.label = 8;
                        case 8:
                            if (oStats) {
                                stats.total += oStats.total;
                                stats.created += oStats.created;
                                stats.updated += oStats.updated;
                                stats.failed += oStats.errors;
                            }
                            if (rStats) {
                                stats.total += rStats.total;
                                stats.created += rStats.created;
                                stats.updated += rStats.updated;
                                stats.failed += rStats.errors;
                            }
                            _a.label = 9;
                        case 9:
                            _i++;
                            return [3 /*break*/, 2];
                        case 10: return [4 /*yield*/, this.larkBot.sendSummary({
                                jobName: 'Near Realtime (2h)',
                                date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                                totalSynced: stats.total,
                                totalCreated: stats.created,
                                totalUpdated: stats.updated,
                                totalFailed: stats.failed,
                            })];
                        case 11:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 2. Daily Backfill: Mỗi ngày 02:00, quét 15 ngày gần nhất
         */
        ReconcileScheduler_1.prototype.reconcileDailyBackfill = function () {
            return __awaiter(this, void 0, void 0, function () {
                var shops, stats, _i, shops_2, shop, now, fifteenDaysAgo, oStats, rStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('⏰ Cron: reconcileDailyBackfill started');
                            return [4 /*yield*/, this.getActiveShops()];
                        case 1:
                            shops = _a.sent();
                            stats = { total: 0, created: 0, updated: 0, failed: 0 };
                            _i = 0, shops_2 = shops;
                            _a.label = 2;
                        case 2:
                            if (!(_i < shops_2.length)) return [3 /*break*/, 10];
                            shop = shops_2[_i];
                            now = Math.floor(Date.now() / 1000);
                            fifteenDaysAgo = now - 15 * 24 * 60 * 60;
                            oStats = void 0, rStats = void 0;
                            if (!(shop.platform === 'TIKTOK')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.reconcileService.reconcileReturns(shop.shopId, fifteenDaysAgo, now)];
                        case 3:
                            rStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileOrders(shop.shopId, fifteenDaysAgo, now)];
                        case 4:
                            oStats = _a.sent();
                            return [3 /*break*/, 8];
                        case 5:
                            if (!(shop.platform === 'SHOPEE')) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeReturns(shop.shopId, fifteenDaysAgo, now)];
                        case 6:
                            rStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeOrders(shop.shopId, fifteenDaysAgo, now)];
                        case 7:
                            oStats = _a.sent();
                            _a.label = 8;
                        case 8:
                            if (oStats) {
                                stats.total += oStats.total;
                                stats.created += oStats.created;
                                stats.updated += oStats.updated;
                                stats.failed += oStats.errors;
                            }
                            if (rStats) {
                                stats.total += rStats.total;
                                stats.created += rStats.created;
                                stats.updated += rStats.updated;
                                stats.failed += rStats.errors;
                            }
                            _a.label = 9;
                        case 9:
                            _i++;
                            return [3 /*break*/, 2];
                        case 10: return [4 /*yield*/, this.larkBot.sendSummary({
                                jobName: 'Daily Backfill (15 days)',
                                date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                                totalSynced: stats.total,
                                totalCreated: stats.created,
                                totalUpdated: stats.updated,
                                totalFailed: stats.failed,
                            })];
                        case 11:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 3. Weekly Safety Sweep: Mỗi Chủ nhật 03:00, quét 30 ngày gần nhất
         */
        ReconcileScheduler_1.prototype.reconcileWeeklySafetySweep = function () {
            return __awaiter(this, void 0, void 0, function () {
                var shops, stats, _i, shops_3, shop, now, thirtyDaysAgo, fifteenDaysAgo, rStats, oStats, rStats1, oStats1, rStats2, oStats2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('⏰ Cron: reconcileWeeklySafetySweep started');
                            return [4 /*yield*/, this.getActiveShops()];
                        case 1:
                            shops = _a.sent();
                            stats = { total: 0, created: 0, updated: 0, failed: 0 };
                            _i = 0, shops_3 = shops;
                            _a.label = 2;
                        case 2:
                            if (!(_i < shops_3.length)) return [3 /*break*/, 11];
                            shop = shops_3[_i];
                            now = Math.floor(Date.now() / 1000);
                            thirtyDaysAgo = now - 30 * 24 * 60 * 60;
                            fifteenDaysAgo = now - 15 * 24 * 60 * 60;
                            if (!(shop.platform === 'TIKTOK')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.reconcileService.reconcileReturns(shop.shopId, thirtyDaysAgo, now)];
                        case 3:
                            rStats = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileOrders(shop.shopId, thirtyDaysAgo, now)];
                        case 4:
                            oStats = _a.sent();
                            if (oStats) {
                                stats.total += oStats.total;
                                stats.created += oStats.created;
                                stats.updated += oStats.updated;
                                stats.failed += oStats.errors;
                            }
                            if (rStats) {
                                stats.total += rStats.total;
                                stats.created += rStats.created;
                                stats.updated += rStats.updated;
                                stats.failed += rStats.errors;
                            }
                            return [3 /*break*/, 10];
                        case 5:
                            if (!(shop.platform === 'SHOPEE')) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeReturns(shop.shopId, fifteenDaysAgo, now)];
                        case 6:
                            rStats1 = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeOrders(shop.shopId, fifteenDaysAgo, now)];
                        case 7:
                            oStats1 = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeReturns(shop.shopId, thirtyDaysAgo, fifteenDaysAgo)];
                        case 8:
                            rStats2 = _a.sent();
                            return [4 /*yield*/, this.reconcileService.reconcileShopeeOrders(shop.shopId, thirtyDaysAgo, fifteenDaysAgo)];
                        case 9:
                            oStats2 = _a.sent();
                            [oStats1, rStats1, oStats2, rStats2].forEach(function (s) {
                                if (s) {
                                    stats.total += s.total;
                                    stats.created += s.created;
                                    stats.updated += s.updated;
                                    stats.failed += s.errors;
                                }
                            });
                            _a.label = 10;
                        case 10:
                            _i++;
                            return [3 /*break*/, 2];
                        case 11: return [4 /*yield*/, this.larkBot.sendSummary({
                                jobName: 'Weekly Safety Sweep (30 days)',
                                date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                                totalSynced: stats.total,
                                totalCreated: stats.created,
                                totalUpdated: stats.updated,
                                totalFailed: stats.failed,
                            })];
                        case 12:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Lấy danh sách shop active.
         */
        ReconcileScheduler_1.prototype.getActiveShops = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.shop.findMany({
                            where: { isActive: true },
                        })];
                });
            });
        };
        return ReconcileScheduler_1;
    }());
    __setFunctionName(_classThis, "ReconcileScheduler");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _reconcileNearRealtime_decorators = [(0, schedule_1.Cron)('*/30 * * * *')];
        _reconcileDailyBackfill_decorators = [(0, schedule_1.Cron)('0 2 * * *')];
        _reconcileWeeklySafetySweep_decorators = [(0, schedule_1.Cron)('0 3 * * 0')];
        __esDecorate(_classThis, null, _reconcileNearRealtime_decorators, { kind: "method", name: "reconcileNearRealtime", static: false, private: false, access: { has: function (obj) { return "reconcileNearRealtime" in obj; }, get: function (obj) { return obj.reconcileNearRealtime; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reconcileDailyBackfill_decorators, { kind: "method", name: "reconcileDailyBackfill", static: false, private: false, access: { has: function (obj) { return "reconcileDailyBackfill" in obj; }, get: function (obj) { return obj.reconcileDailyBackfill; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reconcileWeeklySafetySweep_decorators, { kind: "method", name: "reconcileWeeklySafetySweep", static: false, private: false, access: { has: function (obj) { return "reconcileWeeklySafetySweep" in obj; }, get: function (obj) { return obj.reconcileWeeklySafetySweep; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReconcileScheduler = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReconcileScheduler = _classThis;
}();
exports.ReconcileScheduler = ReconcileScheduler;
