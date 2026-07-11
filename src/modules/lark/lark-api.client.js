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
exports.LarkApiClient = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var LarkApiClient = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LarkApiClient = _classThis = /** @class */ (function () {
        function LarkApiClient_1(configService, httpService) {
            this.configService = configService;
            this.httpService = httpService;
            this.logger = new common_1.Logger(LarkApiClient.name);
            this.baseUrl = 'https://open.larksuite.com/open-apis';
            this.tenantAccessToken = null;
            this.tokenExpiresAt = 0;
        }
        // ============================================
        // Tenant Access Token (with cache)
        // ============================================
        LarkApiClient_1.prototype.getTenantAccessToken = function () {
            return __awaiter(this, void 0, void 0, function () {
                var appId, appSecret, response;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // Nếu token còn hạn (trừ 5 phút buffer), dùng luôn
                            if (this.tenantAccessToken && Date.now() < this.tokenExpiresAt - 300000) {
                                return [2 /*return*/, this.tenantAccessToken];
                            }
                            appId = this.configService.get('LARK_APP_ID');
                            appSecret = this.configService.get('LARK_APP_SECRET');
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/auth/v3/tenant_access_token/internal"), {
                                    app_id: appId,
                                    app_secret: appSecret,
                                }))];
                        case 1:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Failed to get Lark tenant_access_token: ".concat(JSON.stringify(response.data)));
                            }
                            this.tenantAccessToken = response.data.tenant_access_token;
                            this.tokenExpiresAt = Date.now() + (response.data.expire || 7200) * 1000;
                            this.logger.log('✅ Lark tenant_access_token refreshed');
                            return [2 /*return*/, this.tenantAccessToken];
                    }
                });
            });
        };
        // ============================================
        // Generic API helpers
        // ============================================
        LarkApiClient_1.prototype.getHeaders = function () {
            return __awaiter(this, void 0, void 0, function () {
                var token;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTenantAccessToken()];
                        case 1:
                            token = _a.sent();
                            return [2 /*return*/, {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                }];
                    }
                });
            });
        };
        // ============================================
        // Record CRUD
        // ============================================
        /**
         * Tìm record theo giá trị field (dùng cho search by sync_key).
         */
        LarkApiClient_1.prototype.searchRecords = function (appToken, tableId, fieldName, value) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, response;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _b.sent();
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records/search"), {
                                    filter: {
                                        conjunction: 'and',
                                        conditions: [
                                            {
                                                field_name: fieldName,
                                                operator: 'is',
                                                value: [value],
                                            },
                                        ],
                                    },
                                    page_size: 1,
                                }, { headers: headers }))];
                        case 2:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark search failed: ".concat(JSON.stringify(response.data)));
                            }
                            return [2 /*return*/, response.data.data || { items: [] }];
                    }
                });
            });
        };
        /**
         * Tìm nhiều records theo một danh sách các giá trị.
         * Dùng operator: 'in' để tìm nhiều sync_key cùng lúc.
         */
        LarkApiClient_1.prototype.batchSearchRecords = function (appToken, tableId, fieldName, values) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, allItems, pageToken, hasMore, response, data;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (values.length === 0)
                                return [2 /*return*/, { items: [] }];
                            return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _b.sent();
                            allItems = [];
                            pageToken = '';
                            hasMore = true;
                            _b.label = 2;
                        case 2:
                            if (!hasMore) return [3 /*break*/, 4];
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records/search").concat(pageToken ? "?page_token=".concat(pageToken) : ''), {
                                    filter: {
                                        conjunction: 'and',
                                        conditions: [
                                            {
                                                field_name: fieldName,
                                                operator: 'in',
                                                value: values,
                                            },
                                        ],
                                    },
                                    page_size: 500, // Max page size
                                }, { headers: headers }))];
                        case 3:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark batch search failed: ".concat(JSON.stringify(response.data)));
                            }
                            data = response.data.data || {};
                            if (data.items) {
                                allItems = allItems.concat(data.items);
                            }
                            hasMore = data.has_more;
                            pageToken = data.page_token;
                            return [3 /*break*/, 2];
                        case 4: return [2 /*return*/, { items: allItems }];
                    }
                });
            });
        };
        /**
         * Tạo record mới.
         */
        LarkApiClient_1.prototype.createRecord = function (appToken, tableId, fields) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, response;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _d.sent();
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records"), { fields: fields }, { headers: headers }))];
                        case 2:
                            response = _d.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark create record failed: ".concat(JSON.stringify(response.data)));
                            }
                            this.logger.debug("\uD83D\uDCDD Lark record created: ".concat((_c = (_b = response.data.data) === null || _b === void 0 ? void 0 : _b.record) === null || _c === void 0 ? void 0 : _c.record_id));
                            return [2 /*return*/, response.data.data];
                    }
                });
            });
        };
        /**
         * Update record theo record_id.
         */
        LarkApiClient_1.prototype.updateRecord = function (appToken, tableId, recordId, fields) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, response;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _b.sent();
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.put("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records/").concat(recordId), { fields: fields }, { headers: headers }))];
                        case 2:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark update record failed: ".concat(JSON.stringify(response.data)));
                            }
                            this.logger.debug("\uD83D\uDCDD Lark record updated: ".concat(recordId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Batch tạo nhiều records.
         */
        LarkApiClient_1.prototype.batchCreateRecords = function (appToken, tableId, records) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, response;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _b.sent();
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records/batch_create"), { records: records }, { headers: headers }))];
                        case 2:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark batch create failed: ".concat(JSON.stringify(response.data)));
                            }
                            this.logger.log("\uD83D\uDCDD Batch created ".concat(records.length, " records"));
                            return [2 /*return*/, response.data.data];
                    }
                });
            });
        };
        /**
         * Batch update nhiều records.
         */
        LarkApiClient_1.prototype.batchUpdateRecords = function (appToken, tableId, records) {
            return __awaiter(this, void 0, void 0, function () {
                var headers, response;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getHeaders()];
                        case 1:
                            headers = _b.sent();
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post("".concat(this.baseUrl, "/bitable/v1/apps/").concat(appToken, "/tables/").concat(tableId, "/records/batch_update"), { records: records }, { headers: headers }))];
                        case 2:
                            response = _b.sent();
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                                throw new Error("Lark batch update failed: ".concat(JSON.stringify(response.data)));
                            }
                            this.logger.log("\uD83D\uDCDD Batch updated ".concat(records.length, " records"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return LarkApiClient_1;
    }());
    __setFunctionName(_classThis, "LarkApiClient");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LarkApiClient = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LarkApiClient = _classThis;
}();
exports.LarkApiClient = LarkApiClient;
