"use strict";
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
exports.ShopeeTokenService = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var crypto = __importStar(require("crypto"));
var ShopeeTokenService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ShopeeTokenService = _classThis = /** @class */ (function () {
        function ShopeeTokenService_1(configService, httpService, prisma) {
            this.configService = configService;
            this.httpService = httpService;
            this.prisma = prisma;
            this.logger = new common_1.Logger(ShopeeTokenService.name);
            this.baseUrl = 'https://partner.shopeemobile.com';
        }
        ShopeeTokenService_1.prototype.getPartnerId = function () {
            return parseInt(this.configService.get('SHOPEE_PARTNER_ID') || '0', 10);
        };
        ShopeeTokenService_1.prototype.getPartnerKey = function () {
            return this.configService.get('SHOPEE_PARTNER_KEY') || '';
        };
        /**
         * Sinh chữ ký HMAC-SHA256 theo chuẩn Shopee Open API v2
         */
        ShopeeTokenService_1.prototype.generateSignature = function (apiPath, timestamp, shopId, accessToken) {
            var partnerId = this.getPartnerId();
            var partnerKey = this.getPartnerKey();
            // Format: partner_id, api_path, timestamp, access_token, shop_id
            var baseString = "".concat(partnerId).concat(apiPath).concat(timestamp);
            if (accessToken)
                baseString += accessToken;
            if (shopId)
                baseString += shopId;
            return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
        };
        /**
         * Đổi auth_code lấy access_token
         */
        ShopeeTokenService_1.prototype.exchangeCodeForToken = function (code, shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var partnerId, apiPath, timestamp, sign, url, body, response, data, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            partnerId = this.getPartnerId();
                            apiPath = '/api/v2/auth/token/get';
                            timestamp = Math.floor(Date.now() / 1000);
                            sign = this.generateSignature(apiPath, timestamp);
                            url = "".concat(this.baseUrl).concat(apiPath, "?partner_id=").concat(partnerId, "&timestamp=").concat(timestamp, "&sign=").concat(sign);
                            body = {
                                code: code,
                                shop_id: shopId,
                                partner_id: partnerId,
                            };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body, {
                                    headers: { 'Content-Type': 'application/json' }
                                }))];
                        case 2:
                            response = _a.sent();
                            data = response.data;
                            if (data.error) {
                                throw new Error("Shopee token exchange failed: ".concat(JSON.stringify(data)));
                            }
                            result = {
                                shopId: String(shopId),
                                accessToken: data.access_token,
                                refreshToken: data.refresh_token,
                                accessTokenExpiredAt: new Date(Date.now() + (data.expire_in || 0) * 1000),
                                refreshTokenExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Shopee refresh_token usually valid for 30 days
                            };
                            return [4 /*yield*/, this.prisma.shopeeToken.upsert({
                                    where: { shopId: result.shopId },
                                    update: {
                                        accessToken: result.accessToken,
                                        refreshToken: result.refreshToken,
                                        accessTokenExpiredAt: result.accessTokenExpiredAt,
                                        refreshTokenExpiredAt: result.refreshTokenExpiredAt,
                                    },
                                    create: {
                                        shopId: result.shopId,
                                        accessToken: result.accessToken,
                                        refreshToken: result.refreshToken,
                                        accessTokenExpiredAt: result.accessTokenExpiredAt,
                                        refreshTokenExpiredAt: result.refreshTokenExpiredAt,
                                    },
                                })];
                        case 3:
                            _a.sent();
                            this.logger.log("\uD83D\uDCBE Shopee Token saved for shop: ".concat(result.shopId));
                            return [2 /*return*/, result];
                        case 4:
                            error_1 = _a.sent();
                            this.logger.error("\u274C Shopee exchange token error: ".concat(error_1.message));
                            throw error_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Refresh token
         */
        ShopeeTokenService_1.prototype.refreshAccessToken = function (shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var token, partnerId, apiPath, timestamp, sign, url, body, response, data, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shopeeToken.findUnique({
                                where: { shopId: shopId },
                            })];
                        case 1:
                            token = _a.sent();
                            if (!token)
                                throw new Error("No token found for shopee shop: ".concat(shopId));
                            partnerId = this.getPartnerId();
                            apiPath = '/api/v2/auth/access_token/get';
                            timestamp = Math.floor(Date.now() / 1000);
                            sign = this.generateSignature(apiPath, timestamp);
                            url = "".concat(this.baseUrl).concat(apiPath, "?partner_id=").concat(partnerId, "&timestamp=").concat(timestamp, "&sign=").concat(sign);
                            body = {
                                refresh_token: token.refreshToken,
                                shop_id: parseInt(shopId, 10),
                                partner_id: partnerId,
                            };
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, , 6]);
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body, {
                                    headers: { 'Content-Type': 'application/json' }
                                }))];
                        case 3:
                            response = _a.sent();
                            data = response.data;
                            if (data.error) {
                                throw new Error("Shopee token refresh failed: ".concat(JSON.stringify(data)));
                            }
                            return [4 /*yield*/, this.prisma.shopeeToken.update({
                                    where: { shopId: shopId },
                                    data: {
                                        accessToken: data.access_token,
                                        refreshToken: data.refresh_token,
                                        accessTokenExpiredAt: new Date(Date.now() + (data.expire_in || 0) * 1000),
                                        refreshTokenExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                    },
                                })];
                        case 4:
                            _a.sent();
                            this.logger.log("\uD83D\uDD04 Shopee Token refreshed for shop: ".concat(shopId));
                            return [2 /*return*/, data.access_token];
                        case 5:
                            error_2 = _a.sent();
                            this.logger.error("\u274C Shopee refresh token error: ".concat(error_2.message));
                            throw error_2;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get Valid Token (auto refresh if expired)
         */
        ShopeeTokenService_1.prototype.getValidAccessToken = function (shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var token, fiveMinutesFromNow;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.shopeeToken.findUnique({
                                where: { shopId: shopId },
                            })];
                        case 1:
                            token = _a.sent();
                            if (!token) {
                                throw new Error("No token found for shopee shop: ".concat(shopId));
                            }
                            fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
                            if (token.accessTokenExpiredAt && token.accessTokenExpiredAt > fiveMinutesFromNow) {
                                return [2 /*return*/, token.accessToken];
                            }
                            this.logger.warn("\u23F0 Shopee token expiring soon for shop ".concat(shopId, ", refreshing..."));
                            return [2 /*return*/, this.refreshAccessToken(shopId)];
                    }
                });
            });
        };
        return ShopeeTokenService_1;
    }());
    __setFunctionName(_classThis, "ShopeeTokenService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ShopeeTokenService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ShopeeTokenService = _classThis;
}();
exports.ShopeeTokenService = ShopeeTokenService;
