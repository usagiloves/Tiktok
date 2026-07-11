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
exports.TiktokTokenService = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var TiktokTokenService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TiktokTokenService = _classThis = /** @class */ (function () {
        function TiktokTokenService_1(configService, httpService, prisma) {
            this.configService = configService;
            this.httpService = httpService;
            this.prisma = prisma;
            this.logger = new common_1.Logger(TiktokTokenService.name);
            this.oauthStates = new Set();
        }
        // ============================================
        // OAuth State Management
        // ============================================
        TiktokTokenService_1.prototype.saveOAuthState = function (state) {
            var _this = this;
            this.oauthStates.add(state);
            // Tự xóa sau 10 phút
            setTimeout(function () { return _this.oauthStates.delete(state); }, 10 * 60 * 1000);
        };
        TiktokTokenService_1.prototype.verifyOAuthState = function (state) {
            if (this.oauthStates.has(state)) {
                this.oauthStates.delete(state);
                return true;
            }
            return false;
        };
        // ============================================
        // Token Exchange
        // ============================================
        /**
         * Đổi auth_code lấy access_token và refresh_token từ TikTok.
         */
        TiktokTokenService_1.prototype.exchangeCodeForToken = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                var appKey, appSecret, url, response, data, result;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            appKey = this.configService.get('TIKTOK_APP_KEY');
                            appSecret = this.configService.get('TIKTOK_APP_SECRET');
                            url = 'https://auth.tiktok-shops.com/api/v2/token/get';
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                                    params: {
                                        app_key: appKey,
                                        app_secret: appSecret,
                                        auth_code: code,
                                        grant_type: 'authorized_code',
                                    },
                                }))];
                        case 1:
                            response = _b.sent();
                            data = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data;
                            if (!(data === null || data === void 0 ? void 0 : data.access_token)) {
                                throw new Error("TikTok token exchange failed: ".concat(JSON.stringify(response.data)));
                            }
                            result = {
                                shopId: data.open_id || data.seller_id || 'unknown',
                                shopName: data.seller_name || 'TikTok Shop',
                                accessToken: data.access_token,
                                refreshToken: data.refresh_token,
                                accessTokenExpiredAt: new Date(Date.now() + (data.access_token_expire_in || 0) * 1000),
                                refreshTokenExpiredAt: new Date(Date.now() + (data.refresh_token_expire_in || 0) * 1000),
                            };
                            // Lưu vào database (upsert)
                            return [4 /*yield*/, this.prisma.tiktokToken.upsert({
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
                        case 2:
                            // Lưu vào database (upsert)
                            _b.sent();
                            this.logger.log("\uD83D\uDCBE Token saved for shop: ".concat(result.shopId));
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        // ============================================
        // Token Refresh
        // ============================================
        /**
         * Refresh access_token khi gần hết hạn.
         */
        TiktokTokenService_1.prototype.refreshAccessToken = function (shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var token, appKey, appSecret, url, response, data;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.tiktokToken.findUnique({
                                where: { shopId: shopId },
                            })];
                        case 1:
                            token = _b.sent();
                            if (!token) {
                                throw new Error("No token found for shop: ".concat(shopId));
                            }
                            appKey = this.configService.get('TIKTOK_APP_KEY');
                            appSecret = this.configService.get('TIKTOK_APP_SECRET');
                            url = 'https://auth.tiktok-shops.com/api/v2/token/refresh';
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                                    params: {
                                        app_key: appKey,
                                        app_secret: appSecret,
                                        refresh_token: token.refreshToken,
                                        grant_type: 'refresh_token',
                                    },
                                }))];
                        case 2:
                            response = _b.sent();
                            data = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data;
                            if (!(data === null || data === void 0 ? void 0 : data.access_token)) {
                                throw new Error("TikTok token refresh failed for shop ".concat(shopId, ": ").concat(JSON.stringify(response.data)));
                            }
                            return [4 /*yield*/, this.prisma.tiktokToken.update({
                                    where: { shopId: shopId },
                                    data: {
                                        accessToken: data.access_token,
                                        refreshToken: data.refresh_token,
                                        accessTokenExpiredAt: new Date(Date.now() + (data.access_token_expire_in || 0) * 1000),
                                        refreshTokenExpiredAt: new Date(Date.now() + (data.refresh_token_expire_in || 0) * 1000),
                                    },
                                })];
                        case 3:
                            _b.sent();
                            this.logger.log("\uD83D\uDD04 Token refreshed for shop: ".concat(shopId));
                            return [2 /*return*/, data.access_token];
                    }
                });
            });
        };
        // ============================================
        // Get Valid Token
        // ============================================
        /**
         * Lấy access_token hợp lệ. Tự refresh nếu gần hết hạn (< 5 phút).
         */
        TiktokTokenService_1.prototype.getValidAccessToken = function (shopId) {
            return __awaiter(this, void 0, void 0, function () {
                var token, fiveMinutesFromNow;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.tiktokToken.findUnique({
                                where: { shopId: shopId },
                            })];
                        case 1:
                            token = _a.sent();
                            if (!token) {
                                throw new Error("No token found for shop: ".concat(shopId));
                            }
                            fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
                            if (token.accessTokenExpiredAt &&
                                token.accessTokenExpiredAt > fiveMinutesFromNow) {
                                return [2 /*return*/, token.accessToken];
                            }
                            // Token gần hết hạn hoặc đã hết hạn → refresh
                            this.logger.warn("\u23F0 Token expiring soon for shop ".concat(shopId, ", refreshing..."));
                            return [2 /*return*/, this.refreshAccessToken(shopId)];
                    }
                });
            });
        };
        return TiktokTokenService_1;
    }());
    __setFunctionName(_classThis, "TiktokTokenService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TiktokTokenService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TiktokTokenService = _classThis;
}();
exports.TiktokTokenService = TiktokTokenService;
