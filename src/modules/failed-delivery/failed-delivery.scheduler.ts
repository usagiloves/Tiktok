import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FailedDeliveryService } from './failed-delivery.service';

@Injectable()
export class FailedDeliveryScheduler {
  private readonly logger = new Logger(FailedDeliveryScheduler.name);
  private isTrackerRunning = false;

  constructor(private readonly failedDeliveryService: FailedDeliveryService) {}

  // Chạy mỗi 4 tiếng (hoặc cấu hình trong tương lai)
  @Cron('0 */4 * * *')
  async handleTrackingJob() {
    if (this.isTrackerRunning) {
      this.logger.warn('Failed delivery tracker job is already running, skipping this tick...');
      return;
    }

    this.isTrackerRunning = true;
    try {
      this.logger.log('Cron triggered: Starting failed delivery tracker...');
      await this.failedDeliveryService.reconcilePendingFailedDeliveries();
    } catch (error: any) {
      this.logger.error(`Error in failed delivery tracker cron: ${error.message}`, error.stack);
    } finally {
      this.isTrackerRunning = false;
    }
  }
}
