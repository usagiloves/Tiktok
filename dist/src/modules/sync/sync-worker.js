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
var SyncWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const sync_engine_service_1 = require("./sync-engine.service");
const tiktok_api_client_1 = require("../tiktok/tiktok-api.client");
const lark_bot_service_1 = require("../lark/lark-bot.service");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const constants_1 = require("../../common/constants");
let SyncWorker = SyncWorker_1 = class SyncWorker extends bullmq_1.WorkerHost {
    syncEngine;
    tiktokApi;
    larkBot;
    prisma;
    logger = new common_1.Logger(SyncWorker_1.name);
    constructor(syncEngine, tiktokApi, larkBot, prisma) {
        super();
        this.syncEngine = syncEngine;
        this.tiktokApi = tiktokApi;
        this.larkBot = larkBot;
        this.prisma = prisma;
    }
    async process(job) {
        const { orderId, returnId, shopId, source } = job.data;
        this.logger.log(`🔄 Processing job ${job.name}: orderId=${orderId}, returnId=${returnId}, shopId=${shopId}`);
        try {
            const shop = await this.prisma.shop.findFirst({
                where: { shopId, platform: 'TIKTOK' },
            });
            const brand = shop?.brand || 'UNKNOWN';
            const shopCipher = shop?.shopCipher || '';
            if (job.name === constants_1.JOB_NAMES.SYNC_ORDER_TO_LARK && orderId) {
                return await this.processOrder(orderId, shopId, shopCipher, brand, source);
            }
            if (job.name === constants_1.JOB_NAMES.SYNC_RETURN_TO_LARK && (returnId || orderId)) {
                return await this.processReturn(returnId || orderId || '', shopId, shopCipher, brand, source);
            }
            this.logger.warn(`⚠️ Unknown job name: ${job.name}`);
            return { status: 'skipped', reason: 'unknown_job_name' };
        }
        catch (error) {
            const errorMessage = error?.message || 'Unknown error';
            this.logger.error(`❌ Job ${job.name} failed: ${errorMessage}`);
            if (job.attemptsMade >= (job.opts?.attempts || 3) - 1) {
                await this.larkBot.sendAlert({
                    title: '🚨 CẢNH BÁO SYNC TIKTOK → LARK',
                    shopName: shopId,
                    errorType: 'Sync job failed',
                    orderId: orderId || returnId,
                    errorDetail: errorMessage,
                    action: 'Kiểm tra logs và retry thủ công nếu cần.',
                });
            }
            throw error;
        }
    }
    async processOrder(orderId, shopId, shopCipher, brand, source) {
        const orderDetail = (await this.tiktokApi.getOrderDetail(shopId, shopCipher, orderId));
        const orders = (orderDetail.orders ||
            orderDetail.order_list || [orderDetail]);
        const results = [];
        for (const order of orders) {
            const result = await this.syncEngine.syncOrder(order, shopId, brand, source);
            results.push(result);
        }
        return { status: 'success', results };
    }
    async processReturn(returnId, shopId, shopCipher, brand, source) {
        const returnDetail = (await this.tiktokApi.getReturnDetail(shopId, shopCipher, returnId));
        const requestType = this.detectRequestType(returnDetail);
        const result = await this.syncEngine.syncReturn(returnDetail, shopId, brand, requestType, source);
        return { status: 'success', result };
    }
    detectRequestType(data) {
        if (data.cancel_id || data.type === 'CANCEL')
            return constants_1.REQUEST_TYPES.CANCEL;
        if (data.refund_id || data.type === 'REFUND_ONLY')
            return constants_1.REQUEST_TYPES.REFUND;
        if (data.dispute_id || data.is_dispute)
            return constants_1.REQUEST_TYPES.COMPLAINT;
        return constants_1.REQUEST_TYPES.RETURN;
    }
};
exports.SyncWorker = SyncWorker;
exports.SyncWorker = SyncWorker = SyncWorker_1 = __decorate([
    (0, bullmq_1.Processor)(constants_1.QUEUE_NAMES.SYNC_ORDER),
    __metadata("design:paramtypes", [sync_engine_service_1.SyncEngineService,
        tiktok_api_client_1.TiktokApiClient,
        lark_bot_service_1.LarkBotService,
        prisma_service_1.PrismaService])
], SyncWorker);
//# sourceMappingURL=sync-worker.js.map