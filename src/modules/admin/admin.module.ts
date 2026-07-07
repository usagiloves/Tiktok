import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { ReconcileModule } from '../reconcile/reconcile.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [SyncModule, ReconcileModule],
  controllers: [AdminController],
})
export class AdminModule {}
