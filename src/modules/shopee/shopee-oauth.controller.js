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
exports.ShopeeOAuthController = void 0;
var common_1 = require("@nestjs/common");
var ShopeeOAuthController = function () {
    var _classDecorators = [(0, common_1.Controller)('shopee/oauth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getRedirectUrl_decorators;
    var _authorize_decorators;
    var _callback_decorators;
    var ShopeeOAuthController = _classThis = /** @class */ (function () {
        function ShopeeOAuthController_1(configService, shopeeTokenService) {
            this.configService = (__runInitializers(this, _instanceExtraInitializers), configService);
            this.shopeeTokenService = shopeeTokenService;
            this.logger = new common_1.Logger(ShopeeOAuthController.name);
        }
        ShopeeOAuthController_1.prototype.getRedirectUri = function () {
            var configuredRedirectUri = this.configService.get('SHOPEE_REDIRECT_URI');
            if (configuredRedirectUri)
                return configuredRedirectUri;
            var appBaseUrl = this.configService.get('APP_BASE_URL', 'http://localhost:3000');
            return "".concat(appBaseUrl.replace(/\/$/, ''), "/shopee/oauth/callback");
        };
        /**
         * GET /shopee/oauth/redirect-url
         * Trả về URL để seller click vào cấp quyền.
         */
        ShopeeOAuthController_1.prototype.getRedirectUrl = function () {
            var partnerId = this.configService.get('SHOPEE_PARTNER_ID');
            var redirectUri = this.getRedirectUri();
            var apiPath = '/api/v2/shop/auth_partner';
            var timestamp = Math.floor(Date.now() / 1000);
            var sign = this.shopeeTokenService.generateSignature(apiPath, timestamp);
            var authUrl = "https://partner.shopeemobile.com".concat(apiPath, "?partner_id=").concat(partnerId, "&timestamp=").concat(timestamp, "&sign=").concat(sign, "&redirect=").concat(encodeURIComponent(redirectUri));
            return {
                success: true,
                authUrl: authUrl,
            };
        };
        /**
         * GET /shopee/oauth/authorize
         * Sinh URL và redirect
         */
        ShopeeOAuthController_1.prototype.authorize = function (res) {
            var data = this.getRedirectUrl();
            this.logger.log("\uD83D\uDD17 Redirecting to Shopee OAuth: ".concat(data.authUrl));
            res.redirect(data.authUrl);
        };
        /**
         * GET /shopee/oauth/callback
         */
        ShopeeOAuthController_1.prototype.callback = function (code, shopId, res) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenData, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\uD83D\uDCE5 Shopee OAuth callback received. code=".concat(code, ", shop_id=").concat(shopId));
                            if (!code || !shopId) {
                                return [2 /*return*/, res.status(400).json({ success: false, message: 'Missing code or shop_id' })];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.shopeeTokenService.exchangeCodeForToken(code, parseInt(shopId, 10))];
                        case 2:
                            tokenData = _a.sent();
                            this.logger.log("\u2705 Shopee Token obtained for shop: ".concat(tokenData.shopId));
                            return [2 /*return*/, res.status(200).json({
                                    success: true,
                                    message: 'Cấp quyền Shopee thành công!',
                                    data: {
                                        shopId: tokenData.shopId,
                                        accessTokenExpiresAt: tokenData.accessTokenExpiredAt,
                                    },
                                })];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error("\u274C Shopee OAuth callback error: ".concat(error_1.message));
                            return [2 /*return*/, res.status(500).json({
                                    success: false,
                                    message: 'Lỗi khi lấy token Shopee.',
                                    error: error_1.message,
                                })];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return ShopeeOAuthController_1;
    }());
    __setFunctionName(_classThis, "ShopeeOAuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getRedirectUrl_decorators = [(0, common_1.Get)('redirect-url')];
        _authorize_decorators = [(0, common_1.Get)('authorize')];
        _callback_decorators = [(0, common_1.Get)('callback')];
        __esDecorate(_classThis, null, _getRedirectUrl_decorators, { kind: "method", name: "getRedirectUrl", static: false, private: false, access: { has: function (obj) { return "getRedirectUrl" in obj; }, get: function (obj) { return obj.getRedirectUrl; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _authorize_decorators, { kind: "method", name: "authorize", static: false, private: false, access: { has: function (obj) { return "authorize" in obj; }, get: function (obj) { return obj.authorize; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _callback_decorators, { kind: "method", name: "callback", static: false, private: false, access: { has: function (obj) { return "callback" in obj; }, get: function (obj) { return obj.callback; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ShopeeOAuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ShopeeOAuthController = _classThis;
}();
exports.ShopeeOAuthController = ShopeeOAuthController;
