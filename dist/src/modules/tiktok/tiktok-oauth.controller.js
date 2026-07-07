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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TiktokOAuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokOAuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tiktok_token_service_1 = require("./tiktok-token.service");
const crypto = __importStar(require("crypto"));
let TiktokOAuthController = TiktokOAuthController_1 = class TiktokOAuthController {
    configService;
    tiktokTokenService;
    logger = new common_1.Logger(TiktokOAuthController_1.name);
    constructor(configService, tiktokTokenService) {
        this.configService = configService;
        this.tiktokTokenService = tiktokTokenService;
    }
    getRedirectUri() {
        const configuredRedirectUri = this.configService.get('TIKTOK_REDIRECT_URI');
        if (configuredRedirectUri) {
            return configuredRedirectUri;
        }
        const appBaseUrl = this.configService.get('APP_BASE_URL', 'http://localhost:3000');
        return `${appBaseUrl.replace(/\/$/, '')}/tiktok/oauth/callback`;
    }
    getRedirectUrl() {
        const redirectUri = this.getRedirectUri();
        return {
            success: true,
            redirectUri,
            callbackPath: '/tiktok/oauth/callback',
            authorizeEndpoint: '/tiktok/oauth/authorize',
        };
    }
    authorize(res) {
        const appKey = this.configService.get('TIKTOK_APP_KEY');
        const redirectUri = this.getRedirectUri();
        const stateSecret = this.configService.get('OAUTH_STATE_SECRET');
        const state = crypto
            .createHmac('sha256', stateSecret ?? 'default-secret')
            .update(Date.now().toString())
            .digest('hex')
            .substring(0, 32);
        this.tiktokTokenService.saveOAuthState(state);
        const authUrl = `https://auth.tiktok-shops.com/oauth/authorize` +
            `?app_key=${appKey}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}`;
        this.logger.log(`🔗 Redirecting to TikTok OAuth: ${authUrl}`);
        res.redirect(authUrl);
    }
    async callback(code, state, res) {
        this.logger.log(`📥 OAuth callback received. code=${code}, state=${state}`);
        if (!this.tiktokTokenService.verifyOAuthState(state)) {
            this.logger.error('❌ Invalid OAuth state');
            return res.status(400).json({
                success: false,
                message: 'Invalid state parameter. Possible CSRF attack.',
            });
        }
        try {
            const tokenData = await this.tiktokTokenService.exchangeCodeForToken(code);
            this.logger.log(`✅ Token obtained for shop: ${tokenData.shopId}`);
            return res.status(200).json({
                success: true,
                message: 'Cấp quyền TikTok Shop thành công!',
                data: {
                    shopId: tokenData.shopId,
                    shopName: tokenData.shopName,
                    accessTokenExpiresAt: tokenData.accessTokenExpiredAt,
                },
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ OAuth callback error: ${errorMessage}`);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy token TikTok Shop.',
                error: errorMessage,
            });
        }
    }
};
exports.TiktokOAuthController = TiktokOAuthController;
__decorate([
    (0, common_1.Get)('redirect-url'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TiktokOAuthController.prototype, "getRedirectUrl", null);
__decorate([
    (0, common_1.Get)('authorize'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TiktokOAuthController.prototype, "authorize", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TiktokOAuthController.prototype, "callback", null);
exports.TiktokOAuthController = TiktokOAuthController = TiktokOAuthController_1 = __decorate([
    (0, common_1.Controller)('tiktok/oauth'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tiktok_token_service_1.TiktokTokenService])
], TiktokOAuthController);
//# sourceMappingURL=tiktok-oauth.controller.js.map