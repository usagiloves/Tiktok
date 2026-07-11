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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.TiktokApiClient = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var crypto = __importStar(require("crypto"));
var TiktokApiClient = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TiktokApiClient = _classThis = /** @class */ (function () {
        function TiktokApiClient_1(configService, httpService, tiktokTokenService) {
            this.configService = configService;
            this.httpService = httpService;
            this.tiktokTokenService = tiktokTokenService;
            this.logger = new common_1.Logger(TiktokApiClient.name);
            this.baseUrl = 'https://open-api.tiktokglobalshop.com';
        }
        // ============================================
        // Request Signing
        // ============================================
        /**
         * Tạo chữ ký cho TikTok API request.
         */
        TiktokApiClient_1.prototype.generateSignature = function (path, params, body) {
            var _a;
            var appSecret = (_a = this.configService.get('TIKTOK_APP_SECRET')) !== null && _a !== void 0 ? _a : '';
            // Sort params alphabetically
            var sortedKeys = Object.keys(params).sort();
            var paramString = sortedKeys
                .filter(function (key) { return key !== 'sign' && key !== 'access_token'; })
                .map(function (key) { return "".concat(key).concat(params[key]); })
                .join('');
            var baseString = appSecret +
                path +
                paramString +
                (body ? JSON.stringify(body) : '') +
                appSecret;
            return crypto
                .createHmac('sha256', appSecret)
                .update(baseString)
                .digest('hex');
        };
        // ============================================
        // Generic API Call with retry
        // ============================================
        TiktokApiClient_1.prototype.callApi = function (method_1, path_1, shopId_1) {
            return __awaiter(this, arguments, void 0, function (method, path, shopId, params, body, retries) {
                var appKey, accessToken, timestamp, allParams, sign, url, headers, _loop_1, this_1, attempt, state_1;
                var _a, _b, _c;
                if (params === void 0) { params = {}; }
                if (retries === void 0) { retries = 3; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            appKey = (_a = this.configService.get('TIKTOK_APP_KEY')) !== null && _a !== void 0 ? _a : '';
                            return [4 /*yield*/, this.tiktokTokenService.getValidAccessToken(shopId)];
                        case 1:
                            accessToken = _d.sent();
                            timestamp = Math.floor(Date.now() / 1000);
                            allParams = __assign({ app_key: appKey, timestamp: timestamp }, params);
                            sign = this.generateSignature(path, allParams, body);
                            allParams.sign = sign;
                            url = "".concat(this.baseUrl).concat(path);
                            headers = {
                                'content-type': 'application/json',
                                'x-tts-access-token': accessToken,
                            };
                            _loop_1 = function (attempt) {
                                var response, responseData, error_1, errorMessage, backoff_1;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            _e.trys.push([0, 2, , 6]);
                                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(method === 'GET'
                                                    ? this_1.httpService.get(url, { params: allParams, headers: headers })
                                                    : this_1.httpService.post(url, body, { params: allParams, headers: headers }))];
                                        case 1:
                                            response = _e.sent();
                                            responseData = response.data;
                                            if ((responseData === null || responseData === void 0 ? void 0 : responseData.code) !== 0) {
                                                throw new Error("TikTok API error: code=".concat(responseData === null || responseData === void 0 ? void 0 : responseData.code, ", message=").concat(responseData === null || responseData === void 0 ? void 0 : responseData.message));
                                            }
                                            return [2 /*return*/, { value: responseData.data }];
                                        case 2:
                                            error_1 = _e.sent();
                                            errorMessage = ((_c = (_b = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error_1.message || 'Unknown error';
                                            if (!(attempt < retries)) return [3 /*break*/, 4];
                                            backoff_1 = Math.pow(2, attempt) * 1000;
                                            this_1.logger.warn("\u26A0\uFE0F API call failed (attempt ".concat(attempt, "/").concat(retries, "), retrying in ").concat(backoff_1, "ms: ").concat(errorMessage));
                                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, backoff_1); })];
                                        case 3:
                                            _e.sent();
                                            return [3 /*break*/, 5];
                                        case 4:
                                            this_1.logger.error("\u274C API call failed after ".concat(retries, " attempts: ").concat(errorMessage));
                                            throw error_1;
                                        case 5: return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            attempt = 1;
                            _d.label = 2;
                        case 2:
                            if (!(attempt <= retries)) return [3 /*break*/, 5];
                            return [5 /*yield**/, _loop_1(attempt)];
                        case 3:
                            state_1 = _d.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _d.label = 4;
                        case 4:
                            attempt++;
                            return [3 /*break*/, 2];
                        case 5: throw new Error('Unreachable');
                    }
                });
            });
        };
        // ============================================
        // Authorization APIs
        // ============================================
        /**
         * Lấy danh sách shops đã authorize để lấy shop_cipher.
         */
        TiktokApiClient_1.prototype.getAuthorizedShops = function (shopId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.callApi('GET', '/authorization/202309/shops', shopId)];
                });
            });
        };
        // ============================================
        // Order APIs
        // ============================================
        /**
         * Lấy danh sách đơn hàng theo khoảng thời gian update/create.
         */
        TiktokApiClient_1.prototype.getOrderList = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var queryParams, body;
                return __generator(this, function (_a) {
                    queryParams = {
                        shop_cipher: params.shopCipher,
                        page_size: params.pageSize || 50,
                    };
                    if (params.pageToken) {
                        queryParams.page_token = params.pageToken;
                    }
                    body = {};
                    if (params.updateTimeFrom) {
                        body.update_time_ge = params.updateTimeFrom;
                    }
                    if (params.updateTimeTo) {
                        body.update_time_lt = params.updateTimeTo;
                    }
                    if (params.createTimeFrom) {
                        body.create_time_ge = params.createTimeFrom;
                    }
                    if (params.createTimeTo) {
                        body.create_time_lt = params.createTimeTo;
                    }
                    if (params.orderStatus) {
                        body.order_status = params.orderStatus;
                    }
                    return [2 /*return*/, this.callApi('POST', '/order/202309/orders/search', params.shopId, queryParams, body)];
                });
            });
        };
        /**
         * Lấy chi tiết đơn hàng.
         */
        TiktokApiClient_1.prototype.getOrderDetail = function (shopId, shopCipher, orderId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.callApi('GET', '/order/202309/orders', shopId, { shop_cipher: shopCipher, ids: orderId })];
                });
            });
        };
        // ============================================
        // Return/Refund/Cancel APIs
        // ============================================
        /**
         * Lấy danh sách yêu cầu hoàn/trả.
         */
        TiktokApiClient_1.prototype.getReturnList = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var queryParams, body;
                return __generator(this, function (_a) {
                    queryParams = {
                        shop_cipher: params.shopCipher,
                        page_size: params.pageSize || 50,
                    };
                    if (params.pageToken) {
                        queryParams.page_token = params.pageToken;
                    }
                    body = {};
                    if (params.updateTimeFrom) {
                        body.update_time_ge = params.updateTimeFrom;
                    }
                    if (params.updateTimeTo) {
                        body.update_time_lt = params.updateTimeTo;
                    }
                    if (params.createTimeFrom) {
                        body.create_time_ge = params.createTimeFrom;
                    }
                    if (params.createTimeTo) {
                        body.create_time_lt = params.createTimeTo;
                    }
                    return [2 /*return*/, this.callApi('POST', '/return_refund/202309/returns/search', params.shopId, queryParams, body)];
                });
            });
        };
        /**
         * Lấy chi tiết yêu cầu hoàn/trả.
         */
        TiktokApiClient_1.prototype.getReturnDetail = function (shopId, shopCipher, returnId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.callApi('GET', "/return_refund/202309/returns/".concat(returnId), // Note: this path might be invalid as per preview script 404
                        shopId, { shop_cipher: shopCipher })];
                });
            });
        };
        /**
         * Lấy danh sách đơn hủy (nếu còn dùng riêng rẽ, nếu không có thể bỏ qua).
         */
        TiktokApiClient_1.prototype.getCancelList = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.warn('getCancelList is legacy API and may not be supported in 202309');
                    throw new Error('Not implemented for 202309 API. Use order search or return search.');
                });
            });
        };
        return TiktokApiClient_1;
    }());
    __setFunctionName(_classThis, "TiktokApiClient");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TiktokApiClient = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TiktokApiClient = _classThis;
}();
exports.TiktokApiClient = TiktokApiClient;
