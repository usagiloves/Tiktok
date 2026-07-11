import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SyncModule } from '../sync/sync.module';
import { ReconcileModule } from '../reconcile/reconcile.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TiktokModule } from '../tiktok/tiktok.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SyncModule, ReconcileModule, PrismaModule, TiktokModule, HttpModule],
  controllers: [AdminController],
})
export class AdminModule {}
