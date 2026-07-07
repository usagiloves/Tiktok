import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { TiktokOAuthController } from './tiktok-oauth.controller';
import { TiktokWebhookController } from './tiktok-webhook.controller';
import { TiktokTokenService } from './tiktok-token.service';
import { TiktokApiClient } from './tiktok-api.client';
import { QUEUE_NAMES } from '../../common/constants';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.SYNC_ORDER }),
  ],
  controllers: [TiktokOAuthController, TiktokWebhookController],
  providers: [TiktokTokenService, TiktokApiClient],
  exports: [TiktokTokenService, TiktokApiClient],
})
export class TiktokModule {}
