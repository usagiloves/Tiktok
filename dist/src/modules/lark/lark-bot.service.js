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
var LarkBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkBotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let LarkBotService = LarkBotService_1 = class LarkBotService {
    configService;
    httpService;
    logger = new common_1.Logger(LarkBotService_1.name);
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
    }
    async sendAlert(params) {
        const webhookUrl = this.configService.get('LARK_BOT_WEBHOOK_URL');
        if (!webhookUrl) {
            this.logger.warn('⚠️ LARK_BOT_WEBHOOK_URL not configured, skipping alert');
            return;
        }
        const now = new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
        });
        const content = [
            `**${params.title}**`,
            '',
            `🏪 Shop: ${params.shopName || 'N/A'}`,
            `⚠️ Loại lỗi: ${params.errorType}`,
            params.orderId ? `📦 Mã đơn: ${params.orderId}` : null,
            params.requestId ? `🔖 Mã yêu cầu: ${params.requestId}` : null,
            `❌ Lỗi: ${params.errorDetail}`,
            `🕐 Thời gian: ${now}`,
            params.action ? `👉 Action: ${params.action}` : null,
        ]
            .filter(Boolean)
            .join('\n');
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, {
                msg_type: 'text',
                content: {
                    text: content,
                },
            }));
            this.logger.log(`🔔 Alert sent: ${params.title}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Failed to send Lark alert: ${errorMessage}`);
        }
    }
    async sendSummary(params) {
        const webhookUrl = this.configService.get('LARK_BOT_WEBHOOK_URL');
        if (!webhookUrl)
            return;
        const content = [
            `📊 **BÁO CÁO SYNC TIKTOK → LARK**`,
            '',
            `📅 Ngày: ${params.date}`,
            `✅ Tổng đã sync: ${params.totalSynced}`,
            `➕ Tạo mới: ${params.totalCreated}`,
            `🔄 Cập nhật: ${params.totalUpdated}`,
            `❌ Lỗi: ${params.totalFailed}`,
        ].join('\n');
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, {
                msg_type: 'text',
                content: { text: content },
            }));
        }
        catch (error) {
            this.logger.error(`Failed to send summary: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
};
exports.LarkBotService = LarkBotService;
exports.LarkBotService = LarkBotService = LarkBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], LarkBotService);
//# sourceMappingURL=lark-bot.service.js.map