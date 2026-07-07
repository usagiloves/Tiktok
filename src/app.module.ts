import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';

import { TiktokModule } from './modules/tiktok/tiktok.module';
import { LarkModule } from './modules/lark/lark.module';
import { SyncModule } from './modules/sync/sync.module';
import { ReconcileModule } from './modules/reconcile/reconcile.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Global config from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled tasks (cron)
    ScheduleModule.forRoot(),

    // BullMQ queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // HTTP client
    HttpModule,

    // Database
    PrismaModule,

    // Feature modules
    TiktokModule,
    LarkModule,
    SyncModule,
    ReconcileModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
