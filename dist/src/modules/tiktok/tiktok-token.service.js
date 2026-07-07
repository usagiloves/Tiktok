"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TiktokTokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const rxjs_1 = require("rxjs");
let TiktokTokenService = TiktokTokenService_1 = class TiktokTokenService {
    configService;
    httpService;
    prisma;
    logger = new common_1.Logger(TiktokTokenService_1.name);
    oauthStates = new Set();
    constructor(configService, httpService, prisma) {
        this.configService = configService;
        this.httpService = httpService;
        this.prisma = prisma;
    }
    saveOAuthState(state) {
        this.oauthStates.add(state);
        setTimeout(() => this.oauthStates.delete(state), 10 * 60 * 1000);
    }
    verifyOAuthState(state) {
        if (this.oauthStates.has(state)) {
            this.oauthStates.delete(state);
            return true;
        }
        return false;
    }
    async exchangeCodeForToken(code) {
        const appKey = this.configService.get('TIKTOK_APP_KEY');
        const appSecret = this.configService.get('TIKTOK_APP_SECRET');
        const url = 'https://auth.tiktok-shops.com/api/v2/token/get';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            params: {
                app_key: appKey,
                app_secret: appSecret,
                auth_code: code,
                grant_type: 'authorized_code',
            },
        }));
        const data = response.data?.data;
        if (!data?.access_token) {
            throw new Error(`TikTok token exchange failed: ${JSON.stringify(response.data)}`);
        }
        const result = {
            shopId: data.open_id || data.seller_id || 'unknown',
            shopName: data.seller_name || 'TikTok Shop',
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiredAt: new Date(Date.now() + (data.access_token_expire_in || 0) * 1000),
            refreshTokenExpiredAt: new Date(Date.now() + (data.refresh_token_expire_in || 0) * 1000),
        };
        await this.prisma.tiktokToken.upsert({
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
        });
        this.logger.log(`💾 Token saved for shop: ${result.shopId}`);
        return result;
    }
    async refreshAccessToken(shopId) {
        const token = await this.prisma.tiktokToken.findUnique({
            where: { shopId },
        });
        if (!token) {
            throw new Error(`No token found for shop: ${shopId}`);
        }
        const appKey = this.configService.get('TIKTOK_APP_KEY');
        const appSecret = this.configService.get('TIKTOK_APP_SECRET');
        const url = 'https://auth.tiktok-shops.com/api/v2/token/refresh';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            params: {
                app_key: appKey,
                app_secret: appSecret,
                refresh_token: token.refreshToken,
                grant_type: 'refresh_token',
            },
        }));
        const data = response.data?.data;
        if (!data?.access_token) {
            throw new Error(`TikTok token refresh failed for shop ${shopId}: ${JSON.stringify(response.data)}`);
        }
        await this.prisma.tiktokToken.update({
            where: { shopId },
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpiredAt: new Date(Date.now() + (data.access_token_expire_in || 0) * 1000),
                refreshTokenExpiredAt: new Date(Date.now() + (data.refresh_token_expire_in || 0) * 1000),
            },
        });
        this.logger.log(`🔄 Token refreshed for shop: ${shopId}`);
        return data.access_token;
    }
    async getValidAccessToken(shopId) {
        const token = await this.prisma.tiktokToken.findUnique({
            where: { shopId },
        });
        if (!token) {
            throw new Error(`No token found for shop: ${shopId}`);
        }
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        if (token.accessTokenExpiredAt &&
            token.accessTokenExpiredAt > fiveMinutesFromNow) {
            return token.accessToken;
        }
        this.logger.warn(`⏰ Token expiring soon for shop ${shopId}, refreshing...`);
        return this.refreshAccessToken(shopId);
    }
};
exports.TiktokTokenService = TiktokTokenService;
exports.TiktokTokenService = TiktokTokenService = TiktokTokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        prisma_service_1.PrismaService])
], TiktokTokenService);
//# sourceMappingURL=tiktok-token.service.js.map