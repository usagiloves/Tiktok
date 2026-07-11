import { Module } from '@nestjs/common';
import { TiktokModule } from '../tiktok/tiktok.module';
import { ShopeeModule } from '../shopee/shopee.module';
import { SyncModule } from '../sync/sync.module';
import { LarkModule } from '../lark/lark.module';
import { JtExpressModule } from '../jt-express/jt-express.module';
import { ReconcileScheduler } from './reconcile.scheduler';
import { ReconcileService } from './reconcile.service';

@Module({
  imports: [TiktokModule, ShopeeModule, SyncModule, LarkModule, JtExpressModule],
  providers: [ReconcileScheduler, ReconcileService],
  exports: [ReconcileService],
})
export class ReconcileModule {}
