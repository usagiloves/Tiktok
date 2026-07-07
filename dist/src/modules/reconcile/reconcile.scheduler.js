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
var ReconcileScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconcileScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const reconcile_service_1 = require("./reconcile.service");
const lark_bot_service_1 = require("../lark/lark-bot.service");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ReconcileScheduler = ReconcileScheduler_1 = class ReconcileScheduler {
    reconcileService;
    larkBot;
    prisma;
    logger = new common_1.Logger(ReconcileScheduler_1.name);
    constructor(reconcileService, larkBot, prisma) {
        this.reconcileService = reconcileService;
        this.larkBot = larkBot;
        this.prisma = prisma;
    }
    async reconcileRecentOrders() {
        this.logger.log('⏰ Cron: reconcileRecentOrders started');
        const shops = await this.getActiveShops();
        for (const shop of shops) {
            const now = Math.floor(Date.now() / 1000);
            const thirtyMinutesAgo = now - 30 * 60;
            await this.reconcileService.reconcileOrders(shop.shopId, thirtyMinutesAgo, now);
        }
    }
    async reconcileRecentReturns() {
        this.logger.log('⏰ Cron: reconcileRecentReturns started');
        const shops = await this.getActiveShops();
        for (const shop of shops) {
            const now = Math.floor(Date.now() / 1000);
            const twoHoursAgo = now - 2 * 60 * 60;
            await this.reconcileService.reconcileReturns(shop.shopId, twoHoursAgo, now);
        }
    }
    async reconcileWeeklyOrders() {
        this.logger.log('⏰ Cron: reconcileWeeklyOrders started');
        const shops = await this.getActiveShops();
        for (const shop of shops) {
            const now = Math.floor(Date.now() / 1000);
            const sevenDaysAgo = now - 7 * 24 * 60 * 60;
            const stats = await this.reconcileService.reconcileOrders(shop.shopId, sevenDaysAgo, now);
            const today = new Date().toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
            });
            await this.larkBot.sendSummary({
                date: today,
                totalSynced: stats.total,
                totalCreated: stats.created,
                totalUpdated: stats.updated,
                totalFailed: stats.errors,
            });
        }
    }
    async reconcileMonthlyReturns() {
        this.logger.log('⏰ Cron: reconcileMonthlyReturns started');
        const shops = await this.getActiveShops();
        for (const shop of shops) {
            const now = Math.floor(Date.now() / 1000);
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
            await this.reconcileService.reconcileReturns(shop.shopId, thirtyDaysAgo, now);
        }
    }
    async getActiveShops() {
        return this.prisma.shop.findMany({
            where: { platform: 'TIKTOK', isActive: true },
        });
    }
};
exports.ReconcileScheduler = ReconcileScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconcileScheduler.prototype, "reconcileRecentOrders", null);
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconcileScheduler.prototype, "reconcileRecentReturns", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconcileScheduler.prototype, "reconcileWeeklyOrders", null);
__decorate([
    (0, schedule_1.Cron)('0 3 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconcileScheduler.prototype, "reconcileMonthlyReturns", null);
exports.ReconcileScheduler = ReconcileScheduler = ReconcileScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reconcile_service_1.ReconcileService,
        lark_bot_service_1.LarkBotService,
        prisma_service_1.PrismaService])
], ReconcileScheduler);
//# sourceMappingURL=reconcile.scheduler.js.map