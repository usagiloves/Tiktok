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
exports.SyncEngineService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../common/constants");
var uuid_1 = require("uuid");
var SyncEngineService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SyncEngineService = _classThis = /** @class */ (function () {
        function SyncEngineService_1(prisma, larkRecordService, larkBotService, normalizerService) {
            this.prisma = prisma;
            this.larkRecordService = larkRecordService;
            this.larkBotService = larkBotService;
            this.normalizerService = normalizerService;
            this.logger = new common_1.Logger(SyncEngineService.name);
        }
        /**
         * Tách các field _raw_* ra khỏi payload trước khi gửi lên Lark.
         * Các field này chỉ lưu trong DB để debug.
         */
        SyncEngineService_1.prototype.stripRawFields = function (payload) {
            var cleaned = {};
            for (var _i = 0, _a = Object.entries(payload); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if (!key.startsWith('_raw_')) {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        };
        /**
         * Sync một đơn hàng từ TikTok raw data → DB → Lark.
         * Flow đầy đủ: normalize → chống update thừa → upsert DB → upsert Lark → log
         */
        SyncEngineService_1.prototype.syncOrder = function (rawOrder, shopMeta, source) {
            return __awaiter(this, void 0, void 0, function () {
                var traceId, normalized, error_1, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            traceId = (0, uuid_1.v4)().substring(0, 8);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 2, , 4]);
                            normalized = this.normalizerService.normalizeOrder(rawOrder, shopMeta);
                            return [2 /*return*/, this.processNormalizedData(normalized, source, traceId)];
                        case 2:
                            error_1 = _a.sent();
                            errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                            this.logger.error("\u274C [".concat(traceId, "] syncOrder failed: ").concat(errorMessage));
                            return [4 /*yield*/, this.logSync(traceId, 'UNKNOWN', constants_1.SYNC_ACTIONS.ERROR, source, constants_1.SYNC_STATUSES.FAILED, errorMessage)];
                        case 3:
                            _a.sent();
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Sync một yêu cầu hoàn/trả/hủy/khiếu nại.
         */
        SyncEngineService_1.prototype.syncReturn = function (rawReturn, shopMeta, requestType, source) {
            return __awaiter(this, void 0, void 0, function () {
                var traceId, normalized, error_2, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            traceId = (0, uuid_1.v4)().substring(0, 8);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 2, , 4]);
                            normalized = this.normalizerService.normalizeReturn(rawReturn, shopMeta, requestType);
                            return [2 /*return*/, this.processNormalizedData(normalized, source, traceId)];
                        case 2:
                            error_2 = _a.sent();
                            errorMessage = error_2 instanceof Error ? error_2.message : 'Unknown error';
                            this.logger.error("\u274C [".concat(traceId, "] syncReturn failed: ").concat(errorMessage));
                            return [4 /*yield*/, this.logSync(traceId, 'UNKNOWN', constants_1.SYNC_ACTIONS.ERROR, source, constants_1.SYNC_STATUSES.FAILED, errorMessage)];
                        case 3:
                            _a.sent();
                            throw error_2;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Xử lý dữ liệu đã normalize: chống update thừa → upsert DB → upsert Lark → log
         */
        SyncEngineService_1.prototype.processNormalizedData = function (normalized, source, traceId) {
            return __awaiter(this, void 0, void 0, function () {
                var existingRequest, orderRecord, mergedPayload, larkPayload, upsertResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.normalizedRequest.findUnique({
                                where: { syncKey: normalized.syncKey },
                            })];
                        case 1:
                            existingRequest = _a.sent();
                            if (!(normalized.requestType !== 'ORDER' && !normalized.orderCreatedAt)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.normalizedRequest.findFirst({
                                    where: {
                                        platform: normalized.platform,
                                        shopId: normalized.shopId,
                                        orderId: normalized.orderId,
                                        requestType: 'ORDER',
                                    },
                                })];
                        case 2:
                            orderRecord = _a.sent();
                            if (orderRecord === null || orderRecord === void 0 ? void 0 : orderRecord.orderCreatedAt) {
                                normalized.orderCreatedAt = orderRecord.orderCreatedAt;
                                normalized.larkFields['Ngày tạo đơn'] = this.normalizerService.formatLarkDateTime(orderRecord.orderCreatedAt);
                            }
                            _a.label = 3;
                        case 3:
                            if (!(existingRequest &&
                                normalized.lastTiktokUpdateTime &&
                                existingRequest.lastTiktokUpdateTime &&
                                normalized.lastTiktokUpdateTime <= existingRequest.lastTiktokUpdateTime)) return [3 /*break*/, 5];
                            this.logger.debug("\u23ED\uFE0F [".concat(traceId, "] Skipping ").concat(normalized.syncKey, " - no newer update"));
                            return [4 /*yield*/, this.logSync(traceId, normalized.syncKey, constants_1.SYNC_ACTIONS.SKIP, source, constants_1.SYNC_STATUSES.SUCCESS)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { action: constants_1.SYNC_ACTIONS.SKIP, syncKey: normalized.syncKey }];
                        case 5:
                            mergedPayload = __assign(__assign({}, ((existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.payload) || {})), normalized.larkFields);
                            return [4 /*yield*/, this.prisma.normalizedRequest.upsert({
                                    where: { syncKey: normalized.syncKey },
                                    update: {
                                        internalStatus: normalized.internalStatus,
                                        isComplaint: normalized.isComplaint,
                                        warehouseReceivedAt: normalized.warehouseReceivedAt || (existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.warehouseReceivedAt),
                                        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                                        payload: mergedPayload,
                                    },
                                    create: {
                                        syncKey: normalized.syncKey,
                                        platform: normalized.platform,
                                        shopId: normalized.shopId,
                                        brand: normalized.brand,
                                        orderId: normalized.orderId,
                                        requestId: normalized.requestId,
                                        requestType: normalized.requestType,
                                        internalStatus: normalized.internalStatus,
                                        isComplaint: normalized.isComplaint,
                                        orderCreatedAt: normalized.orderCreatedAt,
                                        warehouseReceivedAt: normalized.warehouseReceivedAt,
                                        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                                        payload: mergedPayload,
                                    },
                                })];
                        case 6:
                            _a.sent();
                            larkPayload = this.stripRawFields(mergedPayload);
                            return [4 /*yield*/, this.larkRecordService.upsertRecord({
                                    syncKey: normalized.syncKey,
                                    fields: larkPayload,
                                })];
                        case 7:
                            upsertResult = _a.sent();
                            this.logger.log("\u2705 [".concat(traceId, "] ").concat(upsertResult.action, " ").concat(normalized.syncKey, " \u2192 Lark record ").concat(upsertResult.recordId));
                            // 5. Log
                            return [4 /*yield*/, this.logSync(traceId, normalized.syncKey, upsertResult.action, source, constants_1.SYNC_STATUSES.SUCCESS)];
                        case 8:
                            // 5. Log
                            _a.sent();
                            return [2 /*return*/, { action: upsertResult.action, syncKey: normalized.syncKey }];
                    }
                });
            });
        };
        /**
         * Batch Sync Orders.
         */
        SyncEngineService_1.prototype.syncOrdersBatch = function (rawOrders, shopMeta, source) {
            return __awaiter(this, void 0, void 0, function () {
                var traceId, stats, minTimestamp_1, filtered, normalizedList, batchStats, error_3;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            traceId = (0, uuid_1.v4)().substring(0, 8);
                            stats = { total: rawOrders.length, created: 0, updated: 0, skipped: 0, errors: 0 };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            this.logger.log("\uD83D\uDCE6 [".concat(traceId, "] Batch syncing ").concat(rawOrders.length, " orders..."));
                            minTimestamp_1 = Math.floor(constants_1.SYNC_MIN_DATE.getTime() / 1000);
                            filtered = rawOrders.filter(function (raw) {
                                var createTime = Number(raw.order_create_time || raw.create_time || 0);
                                return createTime >= minTimestamp_1;
                            });
                            if (filtered.length === 0) {
                                this.logger.debug("\u23ED\uFE0F [".concat(traceId, "] All ").concat(rawOrders.length, " orders are before SYNC_MIN_DATE, skipping"));
                                stats.skipped += rawOrders.length;
                                return [2 /*return*/, stats];
                            }
                            if (filtered.length < rawOrders.length) {
                                this.logger.debug("\u23ED\uFE0F [".concat(traceId, "] Filtered out ").concat(rawOrders.length - filtered.length, " old orders (before ").concat(constants_1.SYNC_MIN_DATE.toISOString(), ")"));
                                stats.skipped += rawOrders.length - filtered.length;
                            }
                            normalizedList = filtered.map(function (raw) {
                                return _this.normalizerService.normalizeOrder(raw, shopMeta);
                            });
                            return [4 /*yield*/, this.processBatchNormalizedData(normalizedList, source, traceId)];
                        case 2:
                            batchStats = _a.sent();
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            return [2 /*return*/, stats];
                        case 3:
                            error_3 = _a.sent();
                            this.logger.error("\u274C [".concat(traceId, "] syncOrdersBatch failed: ").concat(error_3 instanceof Error ? error_3.message : 'Unknown'));
                            stats.errors += rawOrders.length;
                            return [2 /*return*/, stats];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Batch Sync Returns.
         */
        SyncEngineService_1.prototype.syncReturnsBatch = function (rawReturns, shopMeta, requestType, source) {
            return __awaiter(this, void 0, void 0, function () {
                var traceId, stats, minTimestamp_2, filtered, normalizedList, batchStats, error_4;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            traceId = (0, uuid_1.v4)().substring(0, 8);
                            stats = { total: rawReturns.length, created: 0, updated: 0, skipped: 0, errors: 0 };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            minTimestamp_2 = Math.floor(constants_1.SYNC_MIN_DATE.getTime() / 1000);
                            filtered = rawReturns.filter(function (raw) {
                                var createTime = Number(raw.order_create_time || raw.create_time || 0);
                                return createTime >= minTimestamp_2;
                            });
                            if (filtered.length === 0) {
                                this.logger.debug("\u23ED\uFE0F [".concat(traceId, "] All ").concat(rawReturns.length, " returns are before SYNC_MIN_DATE, skipping"));
                                stats.skipped += rawReturns.length;
                                return [2 /*return*/, stats];
                            }
                            if (filtered.length < rawReturns.length) {
                                this.logger.debug("\u23ED\uFE0F [".concat(traceId, "] Filtered out ").concat(rawReturns.length - filtered.length, " old returns (before ").concat(constants_1.SYNC_MIN_DATE.toISOString(), ")"));
                                stats.skipped += rawReturns.length - filtered.length;
                            }
                            normalizedList = filtered.map(function (raw) {
                                return _this.normalizerService.normalizeReturn(raw, shopMeta, requestType);
                            });
                            return [4 /*yield*/, this.processBatchNormalizedData(normalizedList, source, traceId)];
                        case 2:
                            batchStats = _a.sent();
                            stats.created += batchStats.created;
                            stats.updated += batchStats.updated;
                            stats.skipped += batchStats.skipped;
                            stats.errors += batchStats.errors;
                            return [2 /*return*/, stats];
                        case 3:
                            error_4 = _a.sent();
                            this.logger.error("\u274C [".concat(traceId, "] syncReturnsBatch failed: ").concat(error_4 instanceof Error ? error_4.message : 'Unknown'));
                            stats.errors += rawReturns.length;
                            return [2 /*return*/, stats];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Xử lý Batch dữ liệu đã normalize.
         */
        SyncEngineService_1.prototype.processBatchNormalizedData = function (normalizedList, source, traceId) {
            return __awaiter(this, void 0, void 0, function () {
                var stats, syncKeys, existingRequests, existingMap, returnRequests, orderIds, orderRecords, orderRecordMap, _i, returnRequests_1, n, orderRecord, toProcess, _a, normalizedList_1, normalized, existing, upsertPromises, larkPayloads, error_5;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            stats = { created: 0, updated: 0, skipped: 0, errors: 0 };
                            if (normalizedList.length === 0)
                                return [2 /*return*/, stats];
                            syncKeys = normalizedList.map(function (n) { return n.syncKey; });
                            return [4 /*yield*/, this.prisma.normalizedRequest.findMany({
                                    where: { syncKey: { in: syncKeys } }
                                })];
                        case 1:
                            existingRequests = _b.sent();
                            existingMap = new Map(existingRequests.map(function (r) { return [r.syncKey, r]; }));
                            returnRequests = normalizedList.filter(function (n) { return n.requestType !== 'ORDER' && !n.orderCreatedAt; });
                            if (!(returnRequests.length > 0)) return [3 /*break*/, 3];
                            orderIds = returnRequests.map(function (r) { return r.orderId; });
                            return [4 /*yield*/, this.prisma.normalizedRequest.findMany({
                                    where: { orderId: { in: orderIds }, requestType: 'ORDER' }
                                })];
                        case 2:
                            orderRecords = _b.sent();
                            orderRecordMap = new Map(orderRecords.map(function (r) { return [r.orderId, r]; }));
                            for (_i = 0, returnRequests_1 = returnRequests; _i < returnRequests_1.length; _i++) {
                                n = returnRequests_1[_i];
                                orderRecord = orderRecordMap.get(n.orderId);
                                if (orderRecord === null || orderRecord === void 0 ? void 0 : orderRecord.orderCreatedAt) {
                                    n.orderCreatedAt = orderRecord.orderCreatedAt;
                                    n.larkFields['Ngày tạo đơn'] = this.normalizerService.formatLarkDateTime(orderRecord.orderCreatedAt);
                                }
                            }
                            _b.label = 3;
                        case 3:
                            toProcess = [];
                            for (_a = 0, normalizedList_1 = normalizedList; _a < normalizedList_1.length; _a++) {
                                normalized = normalizedList_1[_a];
                                existing = existingMap.get(normalized.syncKey);
                                if (existing &&
                                    normalized.lastTiktokUpdateTime &&
                                    existing.lastTiktokUpdateTime &&
                                    normalized.lastTiktokUpdateTime <= existing.lastTiktokUpdateTime) {
                                    stats.skipped++;
                                    continue; // Skip
                                }
                                toProcess.push(normalized);
                                if (existing) {
                                    stats.updated++;
                                }
                                else {
                                    stats.created++;
                                }
                            }
                            if (toProcess.length === 0)
                                return [2 /*return*/, stats];
                            _b.label = 4;
                        case 4:
                            _b.trys.push([4, 7, , 8]);
                            upsertPromises = toProcess.map(function (normalized) {
                                var existingRequest = existingMap.get(normalized.syncKey);
                                var mergedPayload = __assign(__assign({}, ((existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.payload) || {})), normalized.larkFields);
                                return _this.prisma.normalizedRequest.upsert({
                                    where: { syncKey: normalized.syncKey },
                                    update: {
                                        internalStatus: normalized.internalStatus,
                                        isComplaint: normalized.isComplaint,
                                        warehouseReceivedAt: normalized.warehouseReceivedAt || (existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.warehouseReceivedAt),
                                        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                                        payload: mergedPayload,
                                    },
                                    create: {
                                        syncKey: normalized.syncKey,
                                        platform: normalized.platform,
                                        shopId: normalized.shopId,
                                        brand: normalized.brand,
                                        orderId: normalized.orderId,
                                        requestId: normalized.requestId,
                                        requestType: normalized.requestType,
                                        internalStatus: normalized.internalStatus,
                                        isComplaint: normalized.isComplaint,
                                        orderCreatedAt: normalized.orderCreatedAt,
                                        warehouseReceivedAt: normalized.warehouseReceivedAt,
                                        lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                                        payload: mergedPayload,
                                    },
                                });
                            });
                            return [4 /*yield*/, this.prisma.$transaction(upsertPromises)];
                        case 5:
                            _b.sent();
                            larkPayloads = toProcess.map(function (normalized) {
                                var existingRequest = existingMap.get(normalized.syncKey);
                                var mergedPayload = __assign(__assign({}, ((existingRequest === null || existingRequest === void 0 ? void 0 : existingRequest.payload) || {})), normalized.larkFields);
                                return { syncKey: normalized.syncKey, fields: _this.stripRawFields(mergedPayload) };
                            });
                            return [4 /*yield*/, this.larkRecordService.batchUpsertRecords(larkPayloads)];
                        case 6:
                            _b.sent();
                            this.logger.log("\u2705 [".concat(traceId, "] Batch upserted ").concat(toProcess.length, " records from source ").concat(source));
                            return [3 /*break*/, 8];
                        case 7:
                            error_5 = _b.sent();
                            this.logger.error("\u274C [".concat(traceId, "] processBatchNormalizedData failed: ").concat(error_5 instanceof Error ? error_5.message : 'Unknown'));
                            stats.errors += toProcess.length;
                            stats.created = 0;
                            stats.updated = 0;
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/, stats];
                    }
                });
            });
        };
        /**
         * Ghi sync log vào database.
         */
        SyncEngineService_1.prototype.logSync = function (traceId, syncKey, action, source, status, errorMessage) {
            return __awaiter(this, void 0, void 0, function () {
                var logError_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prisma.syncLog.create({
                                    data: {
                                        traceId: traceId,
                                        syncKey: syncKey,
                                        action: action,
                                        source: source,
                                        status: status,
                                        errorMessage: errorMessage,
                                        createdAt: new Date(),
                                    },
                                })];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            logError_1 = _a.sent();
                            this.logger.error("Failed to write sync log: ".concat(logError_1 instanceof Error ? logError_1.message : 'Unknown'));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Retry sync cho một sync_key cụ thể.
         */
        SyncEngineService_1.prototype.retrySyncBySyncKey = function (syncKey) {
            return __awaiter(this, void 0, void 0, function () {
                var request, payload, upsertResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.normalizedRequest.findUnique({
                                where: { syncKey: syncKey },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new Error("No record found for sync_key: ".concat(syncKey));
                            }
                            payload = request.payload || {};
                            return [4 /*yield*/, this.larkRecordService.upsertRecord({
                                    syncKey: syncKey,
                                    fields: this.stripRawFields(payload),
                                })];
                        case 2:
                            upsertResult = _a.sent();
                            this.logger.log("\uD83D\uDD04 Retry ".concat(syncKey, ": ").concat(upsertResult.action));
                            return [4 /*yield*/, this.logSync((0, uuid_1.v4)().substring(0, 8), syncKey, upsertResult.action, 'MANUAL_RETRY', constants_1.SYNC_STATUSES.SUCCESS)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { action: upsertResult.action }];
                    }
                });
            });
        };
        return SyncEngineService_1;
    }());
    __setFunctionName(_classThis, "SyncEngineService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SyncEngineService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SyncEngineService = _classThis;
}();
exports.SyncEngineService = SyncEngineService;
