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
var ReconcileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconcileService = void 0;
const common_1 = require("@nestjs/common");
const tiktok_api_client_1 = require("../tiktok/tiktok-api.client");
const sync_engine_service_1 = require("../sync/sync-engine.service");
const lark_bot_service_1 = require("../lark/lark-bot.service");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const constants_1 = require("../../common/constants");
let ReconcileService = ReconcileService_1 = class ReconcileService {
    tiktokApi;
    syncEngine;
    larkBot;
    prisma;
    logger = new common_1.Logger(ReconcileService_1.name);
    constructor(tiktokApi, syncEngine, larkBot, prisma) {
        this.tiktokApi = tiktokApi;
        this.syncEngine = syncEngine;
        this.larkBot = larkBot;
        this.prisma = prisma;
    }
    async reconcileOrders(shopId, fromTimestamp, toTimestamp) {
        const shop = await this.prisma.shop.findFirst({
            where: { shopId, platform: 'TIKTOK', isActive: true },
        });
        if (!shop) {
            this.logger.warn(`⚠️ Shop ${shopId} not found or inactive`);
            return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
        }
        const brand = shop.brand || 'UNKNOWN';
        const shopCipher = shop.shopCipher || '';
        const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
        let pageToken;
        let hasMore = true;
        while (hasMore) {
            try {
                const result = await this.tiktokApi.getOrderList({
                    shopId,
                    shopCipher,
                    updateTimeFrom: fromTimestamp,
                    updateTimeTo: toTimestamp,
                    pageSize: 50,
                    pageToken,
                });
                const orders = (result.orders || []);
                for (const order of orders) {
                    stats.total++;
                    try {
                        const syncResult = await this.syncEngine.syncOrder(order, shopId, brand, constants_1.SYNC_SOURCES.CRON);
                        if (syncResult.action === 'CREATE')
                            stats.created++;
                        else if (syncResult.action === 'UPDATE')
                            stats.updated++;
                        else
                            stats.skipped++;
                    }
                    catch {
                        stats.errors++;
                    }
                }
                pageToken = result.next_page_token;
                hasMore = !!pageToken && orders.length > 0;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`❌ Reconcile orders failed: ${errorMessage}`);
                hasMore = false;
                stats.errors++;
            }
        }
        this.logger.log(`📊 Reconcile orders done: total=${stats.total}, created=${stats.created}, updated=${stats.updated}, skipped=${stats.skipped}, errors=${stats.errors}`);
        return stats;
    }
    async reconcileReturns(shopId, fromTimestamp, toTimestamp) {
        const shop = await this.prisma.shop.findFirst({
            where: { shopId, platform: 'TIKTOK', isActive: true },
        });
        if (!shop) {
            return { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
        }
        const brand = shop.brand || 'UNKNOWN';
        const shopCipher = shop.shopCipher || '';
        const stats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
        let pageToken;
        let hasMore = true;
        while (hasMore) {
            try {
                const result = await this.tiktokApi.getReturnList({
                    shopId,
                    shopCipher,
                    updateTimeFrom: fromTimestamp,
                    updateTimeTo: toTimestamp,
                    pageSize: 50,
                    pageToken,
                });
                const returns = (result.returns || result.return_refunds || result.return_orders || []);
                for (const returnItem of returns) {
                    stats.total++;
                    try {
                        const requestType = this.detectRequestType(returnItem);
                        const syncResult = await this.syncEngine.syncReturn(returnItem, shopId, brand, requestType, constants_1.SYNC_SOURCES.CRON);
                        if (syncResult.action === 'CREATE')
                            stats.created++;
                        else if (syncResult.action === 'UPDATE')
                            stats.updated++;
                        else
                            stats.skipped++;
                    }
                    catch {
                        stats.errors++;
                    }
                }
                pageToken = result.next_page_token;
                hasMore = !!pageToken && returns.length > 0;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`❌ Reconcile returns failed: ${errorMessage}`);
                hasMore = false;
                stats.errors++;
            }
        }
        this.logger.log(`📊 Reconcile returns done: total=${stats.total}, created=${stats.created}, updated=${stats.updated}, skipped=${stats.skipped}, errors=${stats.errors}`);
        return stats;
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
exports.ReconcileService = ReconcileService;
exports.ReconcileService = ReconcileService = ReconcileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tiktok_api_client_1.TiktokApiClient,
        sync_engine_service_1.SyncEngineService,
        lark_bot_service_1.LarkBotService,
        prisma_service_1.PrismaService])
], ReconcileService);
//# sourceMappingURL=reconcile.service.js.map