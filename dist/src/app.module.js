"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const axios_1 = require("@nestjs/axios");
const tiktok_module_1 = require("./modules/tiktok/tiktok.module");
const lark_module_1 = require("./modules/lark/lark.module");
const sync_module_1 = require("./modules/sync/sync.module");
const reconcile_module_1 = require("./modules/reconcile/reconcile.module");
const admin_module_1 = require("./modules/admin/admin.module");
const prisma_module_1 = require("./common/prisma/prisma.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            axios_1.HttpModule,
            prisma_module_1.PrismaModule,
            tiktok_module_1.TiktokModule,
            lark_module_1.LarkModule,
            sync_module_1.SyncModule,
            reconcile_module_1.ReconcileModule,
            admin_module_1.AdminModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map