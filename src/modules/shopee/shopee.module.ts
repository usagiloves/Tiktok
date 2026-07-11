import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SyncModule } from '../sync/sync.module';
import { ShopeeTokenService } from './shopee-token.service';
import { ShopeeOAuthController } from './shopee-oauth.controller';
import { ShopeeApiClient } from './shopee-api.client';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    forwardRef(() => SyncModule),
  ],
  controllers: [ShopeeOAuthController],
  providers: [ShopeeTokenService, ShopeeApiClient],
  exports: [ShopeeTokenService, ShopeeApiClient],
})
export class ShopeeModule {}
