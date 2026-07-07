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
var LarkApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let LarkApiClient = LarkApiClient_1 = class LarkApiClient {
    configService;
    httpService;
    logger = new common_1.Logger(LarkApiClient_1.name);
    baseUrl = 'https://open.larksuite.com/open-apis';
    tenantAccessToken = null;
    tokenExpiresAt = 0;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
    }
    async getTenantAccessToken() {
        if (this.tenantAccessToken && Date.now() < this.tokenExpiresAt - 300000) {
            return this.tenantAccessToken;
        }
        const appId = this.configService.get('LARK_APP_ID');
        const appSecret = this.configService.get('LARK_APP_SECRET');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
            app_id: appId,
            app_secret: appSecret,
        }));
        if (response.data?.code !== 0) {
            throw new Error(`Failed to get Lark tenant_access_token: ${JSON.stringify(response.data)}`);
        }
        this.tenantAccessToken = response.data.tenant_access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expire || 7200) * 1000;
        this.logger.log('✅ Lark tenant_access_token refreshed');
        return this.tenantAccessToken;
    }
    async getHeaders() {
        const token = await this.getTenantAccessToken();
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async searchRecords(appToken, tableId, fieldName, value) {
        const headers = await this.getHeaders();
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`, {
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
        }, { headers }));
        if (response.data?.code !== 0) {
            throw new Error(`Lark search failed: ${JSON.stringify(response.data)}`);
        }
        return response.data.data || { items: [] };
    }
    async createRecord(appToken, tableId, fields) {
        const headers = await this.getHeaders();
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records`, { fields }, { headers }));
        if (response.data?.code !== 0) {
            throw new Error(`Lark create record failed: ${JSON.stringify(response.data)}`);
        }
        this.logger.debug(`📝 Lark record created: ${response.data.data?.record?.record_id}`);
        return response.data.data;
    }
    async updateRecord(appToken, tableId, recordId, fields) {
        const headers = await this.getHeaders();
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`, { fields }, { headers }));
        if (response.data?.code !== 0) {
            throw new Error(`Lark update record failed: ${JSON.stringify(response.data)}`);
        }
        this.logger.debug(`📝 Lark record updated: ${recordId}`);
    }
    async batchCreateRecords(appToken, tableId, records) {
        const headers = await this.getHeaders();
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, { records }, { headers }));
        if (response.data?.code !== 0) {
            throw new Error(`Lark batch create failed: ${JSON.stringify(response.data)}`);
        }
        this.logger.log(`📝 Batch created ${records.length} records`);
        return response.data.data;
    }
    async batchUpdateRecords(appToken, tableId, records) {
        const headers = await this.getHeaders();
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`, { records }, { headers }));
        if (response.data?.code !== 0) {
            throw new Error(`Lark batch update failed: ${JSON.stringify(response.data)}`);
        }
        this.logger.log(`📝 Batch updated ${records.length} records`);
    }
};
exports.LarkApiClient = LarkApiClient;
exports.LarkApiClient = LarkApiClient = LarkApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], LarkApiClient);
//# sourceMappingURL=lark-api.client.js.map