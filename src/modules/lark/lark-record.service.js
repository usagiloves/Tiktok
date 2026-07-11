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
exports.LarkRecordService = void 0;
var common_1 = require("@nestjs/common");
var LarkRecordService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LarkRecordService = _classThis = /** @class */ (function () {
        function LarkRecordService_1(configService, larkApiClient, prisma) {
            this.configService = configService;
            this.larkApiClient = larkApiClient;
            this.prisma = prisma;
            this.logger = new common_1.Logger(LarkRecordService.name);
        }
        LarkRecordService_1.prototype.getAppToken = function () {
            var _a;
            return (_a = this.configService.get('LARK_BASE_APP_TOKEN')) !== null && _a !== void 0 ? _a : '';
        };
        LarkRecordService_1.prototype.getTableId = function () {
            var _a;
            return (_a = this.configService.get('LARK_TABLE_ID_CSKH')) !== null && _a !== void 0 ? _a : '';
        };
        /**
         * Upsert record vào Lark Base.
         * Flow: Tìm trong DB → Tìm trên Lark → Create/Update
         * Chỉ update các field tự động, KHÔNG ghi đè field thủ công (Ghi chú CSKH, Người phụ trách, etc.)
         */
        LarkRecordService_1.prototype.upsertRecord = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var appToken, tableId, existingLarkRecord, error_1, errorMessage, searchResult, larkRecordId, error_2, createResult, newRecordId, error_3, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            appToken = this.getAppToken();
                            tableId = this.getTableId();
                            return [4 /*yield*/, this.prisma.larkRecord.findUnique({
                                    where: { syncKey: payload.syncKey },
                                })];
                        case 1:
                            existingLarkRecord = _a.sent();
                            if (!existingLarkRecord) return [3 /*break*/, 6];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, , 6]);
                            return [4 /*yield*/, this.larkApiClient.updateRecord(appToken, tableId, existingLarkRecord.larkRecordId, payload.fields)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.larkRecord.update({
                                    where: { syncKey: payload.syncKey },
                                    data: { lastSyncedAt: new Date() },
                                })];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { action: 'UPDATE', recordId: existingLarkRecord.larkRecordId }];
                        case 5:
                            error_1 = _a.sent();
                            errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                            this.logger.error("\u274C Lark update failed for ".concat(payload.syncKey, ": ").concat(errorMessage));
                            throw error_1;
                        case 6:
                            _a.trys.push([6, 11, , 12]);
                            return [4 /*yield*/, this.larkApiClient.searchRecords(appToken, tableId, 'sync_key', payload.syncKey)];
                        case 7:
                            searchResult = _a.sent();
                            if (!(searchResult.items && searchResult.items.length > 0)) return [3 /*break*/, 10];
                            larkRecordId = searchResult.items[0].record_id;
                            return [4 /*yield*/, this.larkApiClient.updateRecord(appToken, tableId, larkRecordId, payload.fields)];
                        case 8:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.larkRecord.create({
                                    data: {
                                        syncKey: payload.syncKey,
                                        larkAppToken: appToken,
                                        larkTableId: tableId,
                                        larkRecordId: larkRecordId,
                                        lastSyncedAt: new Date(),
                                    },
                                })];
                        case 9:
                            _a.sent();
                            return [2 /*return*/, { action: 'UPDATE', recordId: larkRecordId }];
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            error_2 = _a.sent();
                            this.logger.warn("\u26A0\uFE0F Lark search failed, will try to create: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown'));
                            return [3 /*break*/, 12];
                        case 12:
                            _a.trys.push([12, 15, , 16]);
                            this.logger.debug("Creating record with fields: ".concat(JSON.stringify(payload.fields)));
                            return [4 /*yield*/, this.larkApiClient.createRecord(appToken, tableId, __assign(__assign({}, payload.fields), { sync_key: payload.syncKey }))];
                        case 13:
                            createResult = _a.sent();
                            newRecordId = createResult.record.record_id;
                            return [4 /*yield*/, this.prisma.larkRecord.create({
                                    data: {
                                        syncKey: payload.syncKey,
                                        larkAppToken: appToken,
                                        larkTableId: tableId,
                                        larkRecordId: newRecordId,
                                        lastSyncedAt: new Date(),
                                    },
                                })];
                        case 14:
                            _a.sent();
                            return [2 /*return*/, { action: 'CREATE', recordId: newRecordId }];
                        case 15:
                            error_3 = _a.sent();
                            errorMessage = error_3 instanceof Error ? error_3.message : 'Unknown error';
                            this.logger.error("\u274C Lark create failed for ".concat(payload.syncKey, ": ").concat(errorMessage));
                            throw error_3;
                        case 16: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Batch Upsert records vào Lark Base.
         */
        LarkRecordService_1.prototype.batchUpsertRecords = function (payloads) {
            return __awaiter(this, void 0, void 0, function () {
                var appToken, tableId, syncKeys, existingLarkRecords, existingMap, toUpdate, toCreatePayloads, updateSyncKeys, missingInDbPayloads, _i, payloads_1, payload, existing, missingKeys, searchResult, larkFoundMap, _a, missingInDbPayloads_1, payload, foundRecordId, error_4, i, chunk, error_5, toCreate, _loop_1, this_1, i;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (payloads.length === 0)
                                return [2 /*return*/];
                            appToken = this.getAppToken();
                            tableId = this.getTableId();
                            syncKeys = payloads.map(function (p) { return p.syncKey; });
                            return [4 /*yield*/, this.prisma.larkRecord.findMany({
                                    where: { syncKey: { in: syncKeys } },
                                })];
                        case 1:
                            existingLarkRecords = _b.sent();
                            existingMap = new Map(existingLarkRecords.map(function (r) { return [r.syncKey, r]; }));
                            toUpdate = [];
                            toCreatePayloads = [];
                            updateSyncKeys = [];
                            missingInDbPayloads = [];
                            for (_i = 0, payloads_1 = payloads; _i < payloads_1.length; _i++) {
                                payload = payloads_1[_i];
                                existing = existingMap.get(payload.syncKey);
                                if (existing) {
                                    toUpdate.push({
                                        record_id: existing.larkRecordId,
                                        fields: payload.fields,
                                    });
                                    updateSyncKeys.push(payload.syncKey);
                                }
                                else {
                                    missingInDbPayloads.push(payload);
                                }
                            }
                            if (!(missingInDbPayloads.length > 0)) return [3 /*break*/, 12];
                            this.logger.log("\uD83D\uDD0D Searching ".concat(missingInDbPayloads.length, " records in Lark to prevent duplicates..."));
                            missingKeys = missingInDbPayloads.map(function (p) { return p.syncKey; });
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 11, , 12]);
                            return [4 /*yield*/, this.larkApiClient.batchSearchRecords(appToken, tableId, 'sync_key', missingKeys)];
                        case 3:
                            searchResult = _b.sent();
                            if (!(searchResult.items && searchResult.items.length > 0)) return [3 /*break*/, 9];
                            larkFoundMap = new Map(searchResult.items.map(function (item) { return [String(item.fields.sync_key), item.record_id]; }));
                            _a = 0, missingInDbPayloads_1 = missingInDbPayloads;
                            _b.label = 4;
                        case 4:
                            if (!(_a < missingInDbPayloads_1.length)) return [3 /*break*/, 8];
                            payload = missingInDbPayloads_1[_a];
                            foundRecordId = larkFoundMap.get(payload.syncKey);
                            if (!foundRecordId) return [3 /*break*/, 6];
                            // Lark đã có -> Chuyển sang toUpdate và lưu bù vào DB
                            toUpdate.push({
                                record_id: foundRecordId,
                                fields: payload.fields,
                            });
                            updateSyncKeys.push(payload.syncKey);
                            // Self-heal DB
                            return [4 /*yield*/, this.prisma.larkRecord.create({
                                    data: {
                                        syncKey: payload.syncKey,
                                        larkAppToken: appToken,
                                        larkTableId: tableId,
                                        larkRecordId: foundRecordId,
                                        lastSyncedAt: new Date(),
                                    }
                                }).catch(function () { })];
                        case 5:
                            // Self-heal DB
                            _b.sent(); // Bỏ qua lỗi duplicate nếu lỡ có
                            this.logger.debug("\uD83E\uDE79 Self-healed record ".concat(payload.syncKey, " (ID: ").concat(foundRecordId, ")"));
                            return [3 /*break*/, 7];
                        case 6:
                            // Lark thực sự chưa có -> Tạo mới
                            toCreatePayloads.push(payload);
                            _b.label = 7;
                        case 7:
                            _a++;
                            return [3 /*break*/, 4];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            // Không tìm thấy gì trên Lark -> Tạo mới tất cả
                            toCreatePayloads.push.apply(toCreatePayloads, missingInDbPayloads);
                            _b.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            error_4 = _b.sent();
                            this.logger.error("\u26A0\uFE0F Lark batch search failed, falling back to create: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown'));
                            toCreatePayloads.push.apply(toCreatePayloads, missingInDbPayloads);
                            return [3 /*break*/, 12];
                        case 12:
                            if (!(toUpdate.length > 0)) return [3 /*break*/, 20];
                            i = 0;
                            _b.label = 13;
                        case 13:
                            if (!(i < toUpdate.length)) return [3 /*break*/, 18];
                            chunk = toUpdate.slice(i, i + 500);
                            _b.label = 14;
                        case 14:
                            _b.trys.push([14, 16, , 17]);
                            return [4 /*yield*/, this.larkApiClient.batchUpdateRecords(appToken, tableId, chunk)];
                        case 15:
                            _b.sent();
                            return [3 /*break*/, 17];
                        case 16:
                            error_5 = _b.sent();
                            this.logger.error("\u274C Lark batch update failed: ".concat(error_5 instanceof Error ? error_5.message : 'Unknown'));
                            return [3 /*break*/, 17];
                        case 17:
                            i += 500;
                            return [3 /*break*/, 13];
                        case 18: 
                        // Update local db timestamp
                        return [4 /*yield*/, this.prisma.larkRecord.updateMany({
                                where: { syncKey: { in: updateSyncKeys } },
                                data: { lastSyncedAt: new Date() },
                            })];
                        case 19:
                            // Update local db timestamp
                            _b.sent();
                            _b.label = 20;
                        case 20:
                            if (!(toCreatePayloads.length > 0)) return [3 /*break*/, 24];
                            toCreate = toCreatePayloads.map(function (p) { return ({
                                fields: __assign(__assign({}, p.fields), { sync_key: p.syncKey }),
                            }); });
                            _loop_1 = function (i) {
                                var createChunk, payloadChunk, createResult, newDbRecords, error_6;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            createChunk = toCreate.slice(i, i + 500);
                                            payloadChunk = toCreatePayloads.slice(i, i + 500);
                                            _c.label = 1;
                                        case 1:
                                            _c.trys.push([1, 5, , 6]);
                                            return [4 /*yield*/, this_1.larkApiClient.batchCreateRecords(appToken, tableId, createChunk)];
                                        case 2:
                                            createResult = _c.sent();
                                            if (!(createResult.records && createResult.records.length === payloadChunk.length)) return [3 /*break*/, 4];
                                            newDbRecords = createResult.records.map(function (r, index) { return ({
                                                syncKey: payloadChunk[index].syncKey,
                                                larkAppToken: appToken,
                                                larkTableId: tableId,
                                                larkRecordId: r.record_id,
                                                lastSyncedAt: new Date(),
                                            }); });
                                            return [4 /*yield*/, this_1.prisma.larkRecord.createMany({
                                                    data: newDbRecords,
                                                    skipDuplicates: true,
                                                })];
                                        case 3:
                                            _c.sent();
                                            _c.label = 4;
                                        case 4: return [3 /*break*/, 6];
                                        case 5:
                                            error_6 = _c.sent();
                                            this_1.logger.error("\u274C Lark batch create failed: ".concat(error_6 instanceof Error ? error_6.message : 'Unknown'));
                                            return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            i = 0;
                            _b.label = 21;
                        case 21:
                            if (!(i < toCreate.length)) return [3 /*break*/, 24];
                            return [5 /*yield**/, _loop_1(i)];
                        case 22:
                            _b.sent();
                            _b.label = 23;
                        case 23:
                            i += 500;
                            return [3 /*break*/, 21];
                        case 24: return [2 /*return*/];
                    }
                });
            });
        };
        return LarkRecordService_1;
    }());
    __setFunctionName(_classThis, "LarkRecordService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LarkRecordService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LarkRecordService = _classThis;
}();
exports.LarkRecordService = LarkRecordService;
