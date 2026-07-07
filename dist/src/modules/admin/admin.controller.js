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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const sync_engine_service_1 = require("../sync/sync-engine.service");
const reconcile_service_1 = require("../reconcile/reconcile.service");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AdminController = AdminController_1 = class AdminController {
    syncEngine;
    reconcileService;
    prisma;
    logger = new common_1.Logger(AdminController_1.name);
    constructor(syncEngine, reconcileService, prisma) {
        this.syncEngine = syncEngine;
        this.reconcileService = reconcileService;
        this.prisma = prisma;
    }
    async retrySync(body) {
        this.logger.log(`🔄 Manual retry for: ${body.sync_key}`);
        const result = await this.syncEngine.retrySyncBySyncKey(body.sync_key);
        return {
            success: true,
            action: result.action,
            sync_key: body.sync_key,
        };
    }
    async reconcileOrders(body) {
        this.logger.log(`📊 Manual reconcile orders: shop=${body.shop_id}, from=${body.from}, to=${body.to}`);
        const fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);
        const stats = await this.reconcileService.reconcileOrders(body.shop_id, fromTimestamp, toTimestamp);
        return { success: true, stats };
    }
    async reconcileReturns(body) {
        this.logger.log(`📊 Manual reconcile returns: shop=${body.shop_id}, from=${body.from}, to=${body.to}`);
        const fromTimestamp = Math.floor(new Date(body.from).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(body.to).getTime() / 1000);
        const stats = await this.reconcileService.reconcileReturns(body.shop_id, fromTimestamp, toTimestamp);
        return { success: true, stats };
    }
    async getDashboard() {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const [totalSyncToday, failedSyncToday, shops, tokens,] = await Promise.all([
            this.prisma.syncLog.count({
                where: { createdAt: { gte: todayStart } },
            }),
            this.prisma.syncLog.count({
                where: {
                    createdAt: { gte: todayStart },
                    status: 'FAILED',
                },
            }),
            this.prisma.shop.findMany({
                where: { isActive: true },
                select: { shopId: true, shopName: true, brand: true, platform: true },
            }),
            this.prisma.tiktokToken.findMany({
                select: {
                    shopId: true,
                    accessTokenExpiredAt: true,
                    refreshTokenExpiredAt: true,
                },
            }),
        ]);
        const tokenStatuses = tokens.map((t) => ({
            shopId: t.shopId,
            accessTokenValid: t.accessTokenExpiredAt ? t.accessTokenExpiredAt > now : false,
            refreshTokenValid: t.refreshTokenExpiredAt ? t.refreshTokenExpiredAt > now : false,
            accessTokenExpiresIn: t.accessTokenExpiredAt
                ? Math.round((t.accessTokenExpiredAt.getTime() - now.getTime()) / 1000 / 60)
                : 0,
        }));
        const recentErrors = await this.prisma.syncLog.findMany({
            where: { status: 'FAILED' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                traceId: true,
                syncKey: true,
                action: true,
                source: true,
                errorMessage: true,
                createdAt: true,
            },
        });
        return {
            status: 'ok',
            time: now.toISOString(),
            today: {
                totalSync: totalSyncToday,
                failedSync: failedSyncToday,
                successRate: totalSyncToday > 0
                    ? `${(((totalSyncToday - failedSyncToday) / totalSyncToday) * 100).toFixed(1)}%`
                    : 'N/A',
            },
            shops,
            tokens: tokenStatuses,
            recentErrors,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('sync/retry'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "retrySync", null);
__decorate([
    (0, common_1.Post)('reconcile/orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reconcileOrders", null);
__decorate([
    (0, common_1.Post)('reconcile/returns'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reconcileReturns", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [sync_engine_service_1.SyncEngineService,
        reconcile_service_1.ReconcileService,
        prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map