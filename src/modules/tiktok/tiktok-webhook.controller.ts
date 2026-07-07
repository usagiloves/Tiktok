import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QUEUE_NAMES, JOB_NAMES, PLATFORMS } from '../../common/constants';
import * as crypto from 'crypto';

@Controller('webhooks/tiktok')
export class TiktokWebhookController {
  private readonly logger = new Logger(TiktokWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.SYNC_ORDER) private readonly syncQueue: Queue,
  ) {}

  // ============================================
  // Verify Webhook Signature
  // ============================================

  private verifySignature(
    body: string,
    signature: string | undefined,
  ): boolean {
    if (!signature) return false;

    const webhookSecret =
      this.configService.get<string>('TIKTOK_WEBHOOK_SECRET') ?? '';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  }

  // ============================================
  // Order Status Webhook
  // ============================================

  /**
   * POST /webhooks/tiktok/order-status
   * Nhận event khi đơn thay đổi trạng thái.
   */
  @Post('order-status')
  @HttpCode(HttpStatus.OK)
  async handleOrderStatus(
    @Body() body: Record<string, unknown>,
    @Headers('x-tts-signature') signature: string | undefined,
  ) {
    const bodyString = JSON.stringify(body);
    const signatureValid = this.verifySignature(bodyString, signature);

    this.logger.log(
      `📥 Webhook order-status received. Signature valid: ${signatureValid}`,
    );

    // Lưu raw event
    const eventId =
      (body.event_id as string) ||
      `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await this.prisma.webhookEvent.upsert({
      where: {
        platform_eventId: {
          platform: PLATFORMS.TIKTOK,
          eventId,
        },
      },
      update: {
        rawPayload: body as object,
        signatureValid,
      },
      create: {
        platform: PLATFORMS.TIKTOK,
        eventType: 'ORDER_STATUS_CHANGE',
        eventId,
        shopId: body.shop_id as string,
        orderId: body.order_id as string,
        rawPayload: body as object,
        signatureValid,
      },
    });

    if (!signatureValid) {
      this.logger.error('❌ Invalid webhook signature');
      return { code: 0, message: 'ok' }; // Vẫn trả 200 để TikTok không retry
    }

    // Đẩy job vào queue
    await this.syncQueue.add(
      JOB_NAMES.SYNC_ORDER_TO_LARK,
      {
        orderId: body.order_id,
        shopId: body.shop_id,
        eventType: 'ORDER_STATUS_CHANGE',
        source: 'WEBHOOK',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { code: 0, message: 'ok' };
  }

  // ============================================
  // Return/Refund Status Webhook
  // ============================================

  /**
   * POST /webhooks/tiktok/return-status
   * Nhận event khi yêu cầu hoàn/trả thay đổi trạng thái.
   */
  @Post('return-status')
  @HttpCode(HttpStatus.OK)
  async handleReturnStatus(
    @Body() body: Record<string, unknown>,
    @Headers('x-tts-signature') signature: string | undefined,
  ) {
    const bodyString = JSON.stringify(body);
    const signatureValid = this.verifySignature(bodyString, signature);

    this.logger.log(
      `📥 Webhook return-status received. Signature valid: ${signatureValid}`,
    );

    const eventId =
      (body.event_id as string) ||
      `return_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await this.prisma.webhookEvent.upsert({
      where: {
        platform_eventId: {
          platform: PLATFORMS.TIKTOK,
          eventId,
        },
      },
      update: {
        rawPayload: body as object,
        signatureValid,
      },
      create: {
        platform: PLATFORMS.TIKTOK,
        eventType: 'RETURN_STATUS_CHANGE',
        eventId,
        shopId: body.shop_id as string,
        orderId: body.order_id as string,
        rawPayload: body as object,
        signatureValid,
      },
    });

    if (!signatureValid) {
      this.logger.error('❌ Invalid webhook signature');
      return { code: 0, message: 'ok' };
    }

    await this.syncQueue.add(
      JOB_NAMES.SYNC_RETURN_TO_LARK,
      {
        returnId: body.reverse_order_id || body.return_id,
        orderId: body.order_id,
        shopId: body.shop_id,
        eventType: 'RETURN_STATUS_CHANGE',
        source: 'WEBHOOK',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { code: 0, message: 'ok' };
  }
}
