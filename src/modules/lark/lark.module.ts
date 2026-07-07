import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LarkApiClient } from './lark-api.client';
import { LarkRecordService } from './lark-record.service';
import { LarkBotService } from './lark-bot.service';

@Module({
  imports: [HttpModule],
  providers: [LarkApiClient, LarkRecordService, LarkBotService],
  exports: [LarkApiClient, LarkRecordService, LarkBotService],
})
export class LarkModule {}
