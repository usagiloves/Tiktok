"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const lark_api_client_1 = require("./lark-api.client");
const lark_record_service_1 = require("./lark-record.service");
const lark_bot_service_1 = require("./lark-bot.service");
let LarkModule = class LarkModule {
};
exports.LarkModule = LarkModule;
exports.LarkModule = LarkModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [lark_api_client_1.LarkApiClient, lark_record_service_1.LarkRecordService, lark_bot_service_1.LarkBotService],
        exports: [lark_api_client_1.LarkApiClient, lark_record_service_1.LarkRecordService, lark_bot_service_1.LarkBotService],
    })
], LarkModule);
//# sourceMappingURL=lark.module.js.map