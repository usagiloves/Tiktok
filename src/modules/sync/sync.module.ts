import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LarkModule } from '../lark/lark.module';
import { TiktokModule } from '../tiktok/tiktok.module';
import { SyncEngineService } from './sync-engine.service';
import { NormalizerService } from './normalizer.service';
import { StatusMapperService } from './status-mapper.service';
import { SyncWorker } from './sync-worker';
import { QUEUE_NAMES } from '../../common/constants';

@Module({
  imports: [
    LarkModule,
    TiktokModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.SYNC_ORDER },
      { name: QUEUE_NAMES.SYNC_RETURN },
    ),
  ],
  providers: [
    SyncEngineService,
    NormalizerService,
    StatusMapperService,
    SyncWorker,
  ],
  exports: [SyncEngineService, NormalizerService, StatusMapperService],
})
export class SyncModule {}
