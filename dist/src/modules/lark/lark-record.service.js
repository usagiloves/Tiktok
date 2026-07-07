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
var LarkRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkRecordService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const lark_api_client_1 = require("./lark-api.client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let LarkRecordService = LarkRecordService_1 = class LarkRecordService {
    configService;
    larkApiClient;
    prisma;
    logger = new common_1.Logger(LarkRecordService_1.name);
    constructor(configService, larkApiClient, prisma) {
        this.configService = configService;
        this.larkApiClient = larkApiClient;
        this.prisma = prisma;
    }
    getAppToken() {
        return this.configService.get('LARK_BASE_APP_TOKEN') ?? '';
    }
    getTableId() {
        return this.configService.get('LARK_TABLE_ID_CSKH') ?? '';
    }
    async upsertRecord(payload) {
        const appToken = this.getAppToken();
        const tableId = this.getTableId();
        const existingLarkRecord = await this.prisma.larkRecord.findUnique({
            where: { syncKey: payload.syncKey },
        });
        if (existingLarkRecord) {
            try {
                await this.larkApiClient.updateRecord(appToken, tableId, existingLarkRecord.larkRecordId, payload.fields);
                await this.prisma.larkRecord.update({
                    where: { syncKey: payload.syncKey },
                    data: { lastSyncedAt: new Date() },
                });
                return { action: 'UPDATE', recordId: existingLarkRecord.larkRecordId };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`❌ Lark update failed for ${payload.syncKey}: ${errorMessage}`);
                throw error;
            }
        }
        try {
            const searchResult = await this.larkApiClient.searchRecords(appToken, tableId, 'sync_key', payload.syncKey);
            if (searchResult.items && searchResult.items.length > 0) {
                const larkRecordId = searchResult.items[0].record_id;
                await this.larkApiClient.updateRecord(appToken, tableId, larkRecordId, payload.fields);
                await this.prisma.larkRecord.create({
                    data: {
                        syncKey: payload.syncKey,
                        larkAppToken: appToken,
                        larkTableId: tableId,
                        larkRecordId,
                        lastSyncedAt: new Date(),
                    },
                });
                return { action: 'UPDATE', recordId: larkRecordId };
            }
        }
        catch (error) {
            this.logger.warn(`⚠️ Lark search failed, will try to create: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
        try {
            const createResult = await this.larkApiClient.createRecord(appToken, tableId, {
                ...payload.fields,
                sync_key: payload.syncKey,
            });
            const newRecordId = createResult.record.record_id;
            await this.prisma.larkRecord.create({
                data: {
                    syncKey: payload.syncKey,
                    larkAppToken: appToken,
                    larkTableId: tableId,
                    larkRecordId: newRecordId,
                    lastSyncedAt: new Date(),
                },
            });
            return { action: 'CREATE', recordId: newRecordId };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Lark create failed for ${payload.syncKey}: ${errorMessage}`);
            throw error;
        }
    }
};
exports.LarkRecordService = LarkRecordService;
exports.LarkRecordService = LarkRecordService = LarkRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        lark_api_client_1.LarkApiClient,
        prisma_service_1.PrismaService])
], LarkRecordService);
//# sourceMappingURL=lark-record.service.js.map