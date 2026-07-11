import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TiktokModule } from '../tiktok/tiktok.module';
import { ShopeeModule } from '../shopee/shopee.module';
import { SyncModule } from '../sync/sync.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants';
import { FailedDeliveryService } from './failed-delivery.service';
import { FailedDeliveryScheduler } from './failed-delivery.scheduler';

@Module({
  imports: [
    PrismaModule,
    TiktokModule,
    ShopeeModule,
    SyncModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.SYNC_ORDER }),
  ],
  providers: [FailedDeliveryService, FailedDeliveryScheduler],
  exports: [FailedDeliveryService],
})
export class FailedDeliveryModule {}
