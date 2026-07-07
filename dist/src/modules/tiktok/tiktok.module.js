"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bullmq_1 = require("@nestjs/bullmq");
const tiktok_oauth_controller_1 = require("./tiktok-oauth.controller");
const tiktok_webhook_controller_1 = require("./tiktok-webhook.controller");
const tiktok_token_service_1 = require("./tiktok-token.service");
const tiktok_api_client_1 = require("./tiktok-api.client");
const constants_1 = require("../../common/constants");
let TiktokModule = class TiktokModule {
};
exports.TiktokModule = TiktokModule;
exports.TiktokModule = TiktokModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            bullmq_1.BullModule.registerQueue({ name: constants_1.QUEUE_NAMES.SYNC_ORDER }),
        ],
        controllers: [tiktok_oauth_controller_1.TiktokOAuthController, tiktok_webhook_controller_1.TiktokWebhookController],
        providers: [tiktok_token_service_1.TiktokTokenService, tiktok_api_client_1.TiktokApiClient],
        exports: [tiktok_token_service_1.TiktokTokenService, tiktok_api_client_1.TiktokApiClient],
    })
], TiktokModule);
//# sourceMappingURL=tiktok.module.js.map