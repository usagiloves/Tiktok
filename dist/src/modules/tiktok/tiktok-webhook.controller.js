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
var TiktokWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokWebhookController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const constants_1 = require("../../common/constants");
const crypto = __importStar(require("crypto"));
let TiktokWebhookController = TiktokWebhookController_1 = class TiktokWebhookController {
    configService;
    prisma;
    syncQueue;
    logger = new common_1.Logger(TiktokWebhookController_1.name);
    constructor(configService, prisma, syncQueue) {
        this.configService = configService;
        this.prisma = prisma;
        this.syncQueue = syncQueue;
    }
    verifySignature(body, signature) {
        if (!signature)
            return false;
        const webhookSecret = this.configService.get('TIKTOK_WEBHOOK_SECRET') ?? '';
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    }
    async handleOrderStatus(body, signature) {
        const bodyString = JSON.stringify(body);
        const signatureValid = this.verifySignature(bodyString, signature);
        this.logger.log(`📥 Webhook order-status received. Signature valid: ${signatureValid}`);
        const eventId = body.event_id ||
            `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await this.prisma.webhookEvent.upsert({
            where: {
                platform_eventId: {
                    platform: constants_1.PLATFORMS.TIKTOK,
                    eventId,
                },
            },
            update: {
                rawPayload: body,
                signatureValid,
            },
            create: {
                platform: constants_1.PLATFORMS.TIKTOK,
                eventType: 'ORDER_STATUS_CHANGE',
                eventId,
                shopId: body.shop_id,
                orderId: body.order_id,
                rawPayload: body,
                signatureValid,
            },
        });
        if (!signatureValid) {
            this.logger.error('❌ Invalid webhook signature');
            return { code: 0, message: 'ok' };
        }
        await this.syncQueue.add(constants_1.JOB_NAMES.SYNC_ORDER_TO_LARK, {
            orderId: body.order_id,
            shopId: body.shop_id,
            eventType: 'ORDER_STATUS_CHANGE',
            source: 'WEBHOOK',
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        });
        return { code: 0, message: 'ok' };
    }
    async handleReturnStatus(body, signature) {
        const bodyString = JSON.stringify(body);
        const signatureValid = this.verifySignature(bodyString, signature);
        this.logger.log(`📥 Webhook return-status received. Signature valid: ${signatureValid}`);
        const eventId = body.event_id ||
            `return_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await this.prisma.webhookEvent.upsert({
            where: {
                platform_eventId: {
                    platform: constants_1.PLATFORMS.TIKTOK,
                    eventId,
                },
            },
            update: {
                rawPayload: body,
                signatureValid,
            },
            create: {
                platform: constants_1.PLATFORMS.TIKTOK,
                eventType: 'RETURN_STATUS_CHANGE',
                eventId,
                shopId: body.shop_id,
                orderId: body.order_id,
                rawPayload: body,
                signatureValid,
            },
        });
        if (!signatureValid) {
            this.logger.error('❌ Invalid webhook signature');
            return { code: 0, message: 'ok' };
        }
        await this.syncQueue.add(constants_1.JOB_NAMES.SYNC_RETURN_TO_LARK, {
            returnId: body.reverse_order_id || body.return_id,
            orderId: body.order_id,
            shopId: body.shop_id,
            eventType: 'RETURN_STATUS_CHANGE',
            source: 'WEBHOOK',
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        });
        return { code: 0, message: 'ok' };
    }
};
exports.TiktokWebhookController = TiktokWebhookController;
__decorate([
    (0, common_1.Post)('order-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-tts-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TiktokWebhookController.prototype, "handleOrderStatus", null);
__decorate([
    (0, common_1.Post)('return-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-tts-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TiktokWebhookController.prototype, "handleReturnStatus", null);
exports.TiktokWebhookController = TiktokWebhookController = TiktokWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks/tiktok'),
    __param(2, (0, bullmq_1.InjectQueue)(constants_1.QUEUE_NAMES.SYNC_ORDER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        bullmq_2.Queue])
], TiktokWebhookController);
//# sourceMappingURL=tiktok-webhook.controller.js.map