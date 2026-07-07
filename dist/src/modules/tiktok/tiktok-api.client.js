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
var TiktokApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const tiktok_token_service_1 = require("./tiktok-token.service");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let TiktokApiClient = TiktokApiClient_1 = class TiktokApiClient {
    configService;
    httpService;
    tiktokTokenService;
    logger = new common_1.Logger(TiktokApiClient_1.name);
    baseUrl = 'https://open-api.tiktokglobalshop.com';
    constructor(configService, httpService, tiktokTokenService) {
        this.configService = configService;
        this.httpService = httpService;
        this.tiktokTokenService = tiktokTokenService;
    }
    generateSignature(path, params, body) {
        const appSecret = this.configService.get('TIKTOK_APP_SECRET') ?? '';
        const sortedKeys = Object.keys(params).sort();
        const paramString = sortedKeys
            .filter((key) => key !== 'sign' && key !== 'access_token')
            .map((key) => `${key}${params[key]}`)
            .join('');
        const baseString = appSecret +
            path +
            paramString +
            (body ? JSON.stringify(body) : '') +
            appSecret;
        return crypto
            .createHmac('sha256', appSecret)
            .update(baseString)
            .digest('hex');
    }
    async callApi(method, path, shopId, params = {}, body, retries = 3) {
        const appKey = this.configService.get('TIKTOK_APP_KEY') ?? '';
        const accessToken = await this.tiktokTokenService.getValidAccessToken(shopId);
        const timestamp = Math.floor(Date.now() / 1000);
        const allParams = {
            app_key: appKey,
            timestamp,
            ...params,
        };
        const sign = this.generateSignature(path, allParams, body);
        allParams.sign = sign;
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'content-type': 'application/json',
            'x-tts-access-token': accessToken,
        };
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(method === 'GET'
                    ? this.httpService.get(url, { params: allParams, headers })
                    : this.httpService.post(url, body, { params: allParams, headers }));
                const responseData = response.data;
                if (responseData?.code !== 0) {
                    throw new Error(`TikTok API error: code=${responseData?.code}, message=${responseData?.message}`);
                }
                return responseData.data;
            }
            catch (error) {
                const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
                if (attempt < retries) {
                    const backoff = Math.pow(2, attempt) * 1000;
                    this.logger.warn(`⚠️ API call failed (attempt ${attempt}/${retries}), retrying in ${backoff}ms: ${errorMessage}`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                }
                else {
                    this.logger.error(`❌ API call failed after ${retries} attempts: ${errorMessage}`);
                    throw error;
                }
            }
        }
        throw new Error('Unreachable');
    }
    async getAuthorizedShops(shopId) {
        return this.callApi('GET', '/authorization/202309/shops', shopId);
    }
    async getOrderList(params) {
        const queryParams = {
            shop_cipher: params.shopCipher,
            page_size: params.pageSize || 50,
        };
        if (params.pageToken) {
            queryParams.page_token = params.pageToken;
        }
        const body = {};
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
        return this.callApi('POST', '/order/202309/orders/search', params.shopId, queryParams, body);
    }
    async getOrderDetail(shopId, shopCipher, orderId) {
        return this.callApi('GET', '/order/202309/orders', shopId, { shop_cipher: shopCipher, ids: orderId });
    }
    async getReturnList(params) {
        const queryParams = {
            shop_cipher: params.shopCipher,
            page_size: params.pageSize || 50,
        };
        if (params.pageToken) {
            queryParams.page_token = params.pageToken;
        }
        const body = {};
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
        return this.callApi('POST', '/return_refund/202309/returns/search', params.shopId, queryParams, body);
    }
    async getReturnDetail(shopId, shopCipher, returnId) {
        return this.callApi('GET', `/return_refund/202309/returns/${returnId}`, shopId, { shop_cipher: shopCipher });
    }
    async getCancelList(params) {
        this.logger.warn('getCancelList is legacy API and may not be supported in 202309');
        throw new Error('Not implemented for 202309 API. Use order search or return search.');
    }
};
exports.TiktokApiClient = TiktokApiClient;
exports.TiktokApiClient = TiktokApiClient = TiktokApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        tiktok_token_service_1.TiktokTokenService])
], TiktokApiClient);
//# sourceMappingURL=tiktok-api.client.js.map