import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JtExpressClient } from './jt-express.client';
import { JtExpressMapper } from './jt-express.mapper';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [JtExpressClient, JtExpressMapper],
  exports: [JtExpressClient, JtExpressMapper],
})
export class JtExpressModule {}
