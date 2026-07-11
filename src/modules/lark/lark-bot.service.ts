import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LarkBotService {
  private readonly logger = new Logger(LarkBotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Gửi cảnh báo vào group Lark qua Bot Webhook.
   */
  async sendAlert(params: {
    title: string;
    shopName?: string;
    errorType: string;
    orderId?: string;
    requestId?: string;
    errorDetail: string;
    action?: string;
  }): Promise<void> {
    const webhookUrl = this.configService.get<string>('LARK_BOT_WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn('⚠️ LARK_BOT_WEBHOOK_URL not configured, skipping alert');
      return;
    }

    const now = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    const content = [
      `**${params.title}**`,
      '',
      `🏪 Shop: ${params.shopName || 'N/A'}`,
      `⚠️ Loại lỗi: ${params.errorType}`,
      params.orderId ? `📦 Mã đơn: ${params.orderId}` : null,
      params.requestId ? `🔖 Mã yêu cầu: ${params.requestId}` : null,
      `❌ Lỗi: ${params.errorDetail}`,
      `🕐 Thời gian: ${now}`,
      params.action ? `👉 Action: ${params.action}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          msg_type: 'text',
          content: {
            text: content,
          },
        }),
      );

      this.logger.log(`🔔 Alert sent: ${params.title}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send Lark alert: ${errorMessage}`);
    }
  }

  /**
   * Gửi thông báo sync thành công (tùy chọn, dùng cho daily summary).
   */
  async sendSummary(params: {
    jobName: string;
    date: string;
    totalSynced: number;
    totalCreated: number;
    totalUpdated: number;
    totalFailed: number;
  }): Promise<void> {
    const webhookUrl = this.configService.get<string>('LARK_BOT_WEBHOOK_URL');
    if (!webhookUrl) return;

    const content = [
      `📊 **BÁO CÁO ĐỒNG BỘ: ${params.jobName.toUpperCase()}**`,
      '',
      `📅 Thời gian: ${params.date}`,
      `✅ Tổng đã fetch/sync: ${params.totalSynced}`,
      `➕ Tạo mới: ${params.totalCreated}`,
      `🔄 Cập nhật: ${params.totalUpdated}`,
      `❌ Lỗi: ${params.totalFailed}`,
    ].join('\n');

    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          msg_type: 'text',
          content: { text: content },
        }),
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send summary: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }
}
