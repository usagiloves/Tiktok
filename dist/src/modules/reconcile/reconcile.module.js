"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconcileModule = void 0;
const common_1 = require("@nestjs/common");
const tiktok_module_1 = require("../tiktok/tiktok.module");
const sync_module_1 = require("../sync/sync.module");
const lark_module_1 = require("../lark/lark.module");
const reconcile_scheduler_1 = require("./reconcile.scheduler");
const reconcile_service_1 = require("./reconcile.service");
let ReconcileModule = class ReconcileModule {
};
exports.ReconcileModule = ReconcileModule;
exports.ReconcileModule = ReconcileModule = __decorate([
    (0, common_1.Module)({
        imports: [tiktok_module_1.TiktokModule, sync_module_1.SyncModule, lark_module_1.LarkModule],
        providers: [reconcile_scheduler_1.ReconcileScheduler, reconcile_service_1.ReconcileService],
        exports: [reconcile_service_1.ReconcileService],
    })
], ReconcileModule);
//# sourceMappingURL=reconcile.module.js.map