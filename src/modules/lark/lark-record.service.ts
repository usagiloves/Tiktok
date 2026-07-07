import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LarkApiClient } from './lark-api.client';
import { PrismaService } from '../../common/prisma/prisma.service';

interface SyncRecordPayload {
  syncKey: string;
  fields: Record<string, unknown>;
}

interface UpsertResult {
  action: 'CREATE' | 'UPDATE' | 'SKIP';
  recordId: string;
}

@Injectable()
export class LarkRecordService {
  private readonly logger = new Logger(LarkRecordService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly larkApiClient: LarkApiClient,
    private readonly prisma: PrismaService,
  ) {}

  private getAppToken(): string {
    return this.configService.get<string>('LARK_BASE_APP_TOKEN') ?? '';
  }

  private getTableId(): string {
    return this.configService.get<string>('LARK_TABLE_ID_CSKH') ?? '';
  }

  /**
   * Upsert record vào Lark Base.
   * Flow: Tìm trong DB → Tìm trên Lark → Create/Update
   * Chỉ update các field tự động, KHÔNG ghi đè field thủ công (Ghi chú CSKH, Người phụ trách, etc.)
   */
  async upsertRecord(payload: SyncRecordPayload): Promise<UpsertResult> {
    const appToken = this.getAppToken();
    const tableId = this.getTableId();

    // 1. Tìm trong database xem đã có record_id chưa
    const existingLarkRecord = await this.prisma.larkRecord.findUnique({
      where: { syncKey: payload.syncKey },
    });

    if (existingLarkRecord) {
      // Đã có → Update record trên Lark
      try {
        await this.larkApiClient.updateRecord(
          appToken,
          tableId,
          existingLarkRecord.larkRecordId,
          payload.fields,
        );

        await this.prisma.larkRecord.update({
          where: { syncKey: payload.syncKey },
          data: { lastSyncedAt: new Date() },
        });

        return { action: 'UPDATE', recordId: existingLarkRecord.larkRecordId };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `❌ Lark update failed for ${payload.syncKey}: ${errorMessage}`,
        );
        throw error;
      }
    }

    // 2. Chưa có trong DB → Search trên Lark theo sync_key
    try {
      const searchResult = await this.larkApiClient.searchRecords(
        appToken,
        tableId,
        'sync_key',
        payload.syncKey,
      );

      if (searchResult.items && searchResult.items.length > 0) {
        // Lark đã có record → Update và lưu record_id
        const larkRecordId = searchResult.items[0].record_id;

        await this.larkApiClient.updateRecord(
          appToken,
          tableId,
          larkRecordId,
          payload.fields,
        );

        await this.prisma.larkRecord.create({
          data: {
            syncKey: payload.syncKey,
            larkAppToken: appToken,
            larkTableId: tableId,
            larkRecordId,
            lastSyncedAt: new Date(),
          },
        });

        return { action: 'UPDATE', recordId: larkRecordId };
      }
    } catch (error: unknown) {
      this.logger.warn(
        `⚠️ Lark search failed, will try to create: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }

    // 3. Lark chưa có → Create record mới
    try {
      const createResult = await this.larkApiClient.createRecord(
        appToken,
        tableId,
        {
          ...payload.fields,
          sync_key: payload.syncKey,
        },
      );

      const newRecordId = createResult.record.record_id;

      await this.prisma.larkRecord.create({
        data: {
          syncKey: payload.syncKey,
          larkAppToken: appToken,
          larkTableId: tableId,
          larkRecordId: newRecordId,
          lastSyncedAt: new Date(),
        },
      });

      return { action: 'CREATE', recordId: newRecordId };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Lark create failed for ${payload.syncKey}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
