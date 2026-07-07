import { Module } from '@nestjs/common';
import { TiktokModule } from '../tiktok/tiktok.module';
import { SyncModule } from '../sync/sync.module';
import { LarkModule } from '../lark/lark.module';
import { ReconcileScheduler } from './reconcile.scheduler';
import { ReconcileService } from './reconcile.service';

@Module({
  imports: [TiktokModule, SyncModule, LarkModule],
  providers: [ReconcileScheduler, ReconcileService],
  exports: [ReconcileService],
})
export class ReconcileModule {}
