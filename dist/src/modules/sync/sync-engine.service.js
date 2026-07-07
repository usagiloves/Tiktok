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
var SyncEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const lark_record_service_1 = require("../lark/lark-record.service");
const lark_bot_service_1 = require("../lark/lark-bot.service");
const normalizer_service_1 = require("./normalizer.service");
const constants_1 = require("../../common/constants");
const uuid_1 = require("uuid");
let SyncEngineService = SyncEngineService_1 = class SyncEngineService {
    prisma;
    larkRecordService;
    larkBotService;
    normalizerService;
    logger = new common_1.Logger(SyncEngineService_1.name);
    constructor(prisma, larkRecordService, larkBotService, normalizerService) {
        this.prisma = prisma;
        this.larkRecordService = larkRecordService;
        this.larkBotService = larkBotService;
        this.normalizerService = normalizerService;
    }
    async syncOrder(rawOrder, shopId, brand, source) {
        const traceId = (0, uuid_1.v4)().substring(0, 8);
        try {
            const normalized = this.normalizerService.normalizeOrder(rawOrder, shopId, brand);
            return this.processNormalizedData(normalized, source, traceId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ [${traceId}] syncOrder failed: ${errorMessage}`);
            await this.logSync(traceId, 'UNKNOWN', constants_1.SYNC_ACTIONS.ERROR, source, constants_1.SYNC_STATUSES.FAILED, errorMessage);
            throw error;
        }
    }
    async syncReturn(rawReturn, shopId, brand, requestType, source) {
        const traceId = (0, uuid_1.v4)().substring(0, 8);
        try {
            const normalized = this.normalizerService.normalizeReturn(rawReturn, shopId, brand, requestType);
            return this.processNormalizedData(normalized, source, traceId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ [${traceId}] syncReturn failed: ${errorMessage}`);
            await this.logSync(traceId, 'UNKNOWN', constants_1.SYNC_ACTIONS.ERROR, source, constants_1.SYNC_STATUSES.FAILED, errorMessage);
            throw error;
        }
    }
    async processNormalizedData(normalized, source, traceId) {
        const existingRequest = await this.prisma.normalizedRequest.findUnique({
            where: { syncKey: normalized.syncKey },
        });
        if (existingRequest &&
            normalized.lastTiktokUpdateTime &&
            existingRequest.lastTiktokUpdateTime &&
            normalized.lastTiktokUpdateTime <= existingRequest.lastTiktokUpdateTime) {
            this.logger.debug(`⏭️ [${traceId}] Skipping ${normalized.syncKey} - no newer update`);
            await this.logSync(traceId, normalized.syncKey, constants_1.SYNC_ACTIONS.SKIP, source, constants_1.SYNC_STATUSES.SUCCESS);
            return { action: constants_1.SYNC_ACTIONS.SKIP, syncKey: normalized.syncKey };
        }
        await this.prisma.normalizedRequest.upsert({
            where: { syncKey: normalized.syncKey },
            update: {
                internalStatus: normalized.internalStatus,
                isComplaint: normalized.isComplaint,
                warehouseReceivedAt: normalized.warehouseReceivedAt,
                lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                payload: normalized.larkFields,
            },
            create: {
                syncKey: normalized.syncKey,
                platform: normalized.platform,
                shopId: normalized.shopId,
                brand: normalized.brand,
                orderId: normalized.orderId,
                requestId: normalized.requestId,
                requestType: normalized.requestType,
                internalStatus: normalized.internalStatus,
                isComplaint: normalized.isComplaint,
                orderCreatedAt: normalized.orderCreatedAt,
                warehouseReceivedAt: normalized.warehouseReceivedAt,
                lastTiktokUpdateTime: normalized.lastTiktokUpdateTime,
                payload: normalized.larkFields,
            },
        });
        const upsertResult = await this.larkRecordService.upsertRecord({
            syncKey: normalized.syncKey,
            fields: normalized.larkFields,
        });
        this.logger.log(`✅ [${traceId}] ${upsertResult.action} ${normalized.syncKey} → Lark record ${upsertResult.recordId}`);
        await this.logSync(traceId, normalized.syncKey, upsertResult.action, source, constants_1.SYNC_STATUSES.SUCCESS);
        return { action: upsertResult.action, syncKey: normalized.syncKey };
    }
    async logSync(traceId, syncKey, action, source, status, errorMessage) {
        try {
            await this.prisma.syncLog.create({
                data: {
                    traceId,
                    syncKey,
                    action,
                    source,
                    status,
                    errorMessage,
                    createdAt: new Date(),
                },
            });
        }
        catch (logError) {
            this.logger.error(`Failed to write sync log: ${logError instanceof Error ? logError.message : 'Unknown'}`);
        }
    }
    async retrySyncBySyncKey(syncKey) {
        const request = await this.prisma.normalizedRequest.findUnique({
            where: { syncKey },
        });
        if (!request) {
            throw new Error(`No record found for sync_key: ${syncKey}`);
        }
        const payload = request.payload || {};
        const upsertResult = await this.larkRecordService.upsertRecord({
            syncKey,
            fields: payload,
        });
        this.logger.log(`🔄 Retry ${syncKey}: ${upsertResult.action}`);
        await this.logSync((0, uuid_1.v4)().substring(0, 8), syncKey, upsertResult.action, 'MANUAL_RETRY', constants_1.SYNC_STATUSES.SUCCESS);
        return { action: upsertResult.action };
    }
};
exports.SyncEngineService = SyncEngineService;
exports.SyncEngineService = SyncEngineService = SyncEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        lark_record_service_1.LarkRecordService,
        lark_bot_service_1.LarkBotService,
        normalizer_service_1.NormalizerService])
], SyncEngineService);
//# sourceMappingURL=sync-engine.service.js.map