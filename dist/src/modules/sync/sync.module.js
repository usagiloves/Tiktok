"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const lark_module_1 = require("../lark/lark.module");
const tiktok_module_1 = require("../tiktok/tiktok.module");
const sync_engine_service_1 = require("./sync-engine.service");
const normalizer_service_1 = require("./normalizer.service");
const status_mapper_service_1 = require("./status-mapper.service");
const sync_worker_1 = require("./sync-worker");
const constants_1 = require("../../common/constants");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [
            lark_module_1.LarkModule,
            tiktok_module_1.TiktokModule,
            bullmq_1.BullModule.registerQueue({ name: constants_1.QUEUE_NAMES.SYNC_ORDER }, { name: constants_1.QUEUE_NAMES.SYNC_RETURN }),
        ],
        providers: [
            sync_engine_service_1.SyncEngineService,
            normalizer_service_1.NormalizerService,
            status_mapper_service_1.StatusMapperService,
            sync_worker_1.SyncWorker,
        ],
        exports: [sync_engine_service_1.SyncEngineService, normalizer_service_1.NormalizerService, status_mapper_service_1.StatusMapperService],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map