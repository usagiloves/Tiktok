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
      this.logger.debug(`Creating record with fields: ${JSON.stringify(payload.fields)}`);
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

  /**
   * Batch Upsert records vào Lark Base.
   */
  async batchUpsertRecords(payloads: SyncRecordPayload[]): Promise<{ created: number; updated: number; failed: number }> {
    if (payloads.length === 0) return { created: 0, updated: 0, failed: 0 };

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    const appToken = this.getAppToken();
    const tableId = this.getTableId();

    // 1. Tìm trong database xem đã có record_id chưa
    const syncKeys = payloads.map((p) => p.syncKey);
    const existingLarkRecords = await this.prisma.larkRecord.findMany({
      where: { syncKey: { in: syncKeys } },
    });

    const existingMap = new Map(existingLarkRecords.map((r) => [r.syncKey, r]));

    const toUpdate: { record_id: string; sync_key: string; fields: Record<string, unknown> }[] = [];
    const toCreatePayloads: SyncRecordPayload[] = [];
    const updateSyncKeys: string[] = [];
    const missingInDbPayloads: SyncRecordPayload[] = [];

    for (const payload of payloads) {
      const existing = existingMap.get(payload.syncKey);
      if (existing) {
        toUpdate.push({
          record_id: existing.larkRecordId,
          sync_key: payload.syncKey,
          fields: payload.fields,
        });
        updateSyncKeys.push(payload.syncKey);
      } else {
        missingInDbPayloads.push(payload);
      }
    }

    // 1.5 Tìm kiếm trên Lark những records không có trong DB (Self-heal)
    if (missingInDbPayloads.length > 0) {
      this.logger.log(`🔍 Searching ${missingInDbPayloads.length} records in Lark to prevent duplicates...`);
      const missingKeys = missingInDbPayloads.map(p => p.syncKey);
      
      try {
        const chunkSize = 100;
        const allSearchResults: any[] = [];
        
        for (let i = 0; i < missingKeys.length; i += chunkSize) {
          const chunk = missingKeys.slice(i, i + chunkSize);
          const searchResult = await this.larkApiClient.batchSearchRecords(
            appToken, 
            tableId, 
            'sync_key', 
            chunk
          );
          if (searchResult.items && searchResult.items.length > 0) {
            allSearchResults.push(...searchResult.items);
          }
        }

        if (allSearchResults.length > 0) {
          this.logger.log(`Found ${allSearchResults.length} records in Lark that were missing in DB.`);
          const larkFoundMap = new Map(allSearchResults.map(item => [String(item.fields.sync_key), item.record_id]));
          
          for (const payload of missingInDbPayloads) {
            const foundRecordId = larkFoundMap.get(payload.syncKey);
            if (foundRecordId) {
              // Lark đã có -> Chuyển sang toUpdate và lưu bù vào DB
              toUpdate.push({
                record_id: foundRecordId,
                sync_key: payload.syncKey,
                fields: payload.fields,
              });
              updateSyncKeys.push(payload.syncKey);
              
              // Self-heal DB
              await this.prisma.larkRecord.create({
                data: {
                  syncKey: payload.syncKey,
                  larkAppToken: appToken,
                  larkTableId: tableId,
                  larkRecordId: foundRecordId,
                  lastSyncedAt: new Date(),
                }
              }).catch(() => {}); // Bỏ qua lỗi duplicate nếu lỡ có
              
              this.logger.debug(`🩹 Self-healed record ${payload.syncKey} (ID: ${foundRecordId})`);
            } else {
              // Lark thực sự chưa có -> Tạo mới
              toCreatePayloads.push(payload);
            }
          }
        } else {
           // Không tìm thấy gì trên Lark -> Tạo mới tất cả
           toCreatePayloads.push(...missingInDbPayloads);
        }
      } catch (error) {
        this.logger.error(`⚠️ Lark batch search failed, falling back to create: ${error instanceof Error ? error.message : 'Unknown'}`);
        toCreatePayloads.push(...missingInDbPayloads);
      }
    }

    // 2. Thực hiện Batch Update (mỗi lần max 500 records)
    if (toUpdate.length > 0) {
      for (let i = 0; i < toUpdate.length; i += 500) {
        const chunk = toUpdate.slice(i, i + 500);
        try {
          const apiChunk = chunk.map(c => ({ record_id: c.record_id, fields: c.fields }));
          await this.larkApiClient.batchUpdateRecords(appToken, tableId, apiChunk);
          updatedCount += chunk.length;
        } catch (error) {
          this.logger.warn(`⚠️ Lark batch update failed, falling back to 1-by-1: ${error instanceof Error ? error.message : 'Unknown'}`);
          for (const item of chunk) {
            try {
              await this.larkApiClient.updateRecord(appToken, tableId, item.record_id, item.fields);
              updatedCount++;
            } catch (fallbackError) {
              failedCount++;
              this.logger.error(`❌ Lark individual update failed for syncKey ${item.sync_key} (record_id ${item.record_id}): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
            }
          }
        }
      }
      // Update local db timestamp
      await this.prisma.larkRecord.updateMany({
        where: { syncKey: { in: updateSyncKeys } },
        data: { lastSyncedAt: new Date() },
      });
    }

    // 3. Thực hiện Batch Create (mỗi lần max 500 records)
    if (toCreatePayloads.length > 0) {
      const toCreate = toCreatePayloads.map((p) => ({
        sync_key: p.syncKey,
        fields: { ...p.fields, sync_key: p.syncKey },
      }));

      for (let i = 0; i < toCreate.length; i += 500) {
        const createChunk = toCreate.slice(i, i + 500);
        const apiChunk = createChunk.map(c => ({ fields: c.fields }));
        const payloadChunk = toCreatePayloads.slice(i, i + 500);
        try {
          const createResult = await this.larkApiClient.batchCreateRecords(
            appToken,
            tableId,
            apiChunk
          );

          if (createResult.records && createResult.records.length === payloadChunk.length) {
            createdCount += payloadChunk.length;
            // Save to local db
            const newDbRecords = createResult.records.map((r: any, index: number) => ({
              syncKey: payloadChunk[index].syncKey,
              larkAppToken: appToken,
              larkTableId: tableId,
              larkRecordId: r.record_id,
              lastSyncedAt: new Date(),
            }));
            await this.prisma.larkRecord.createMany({
              data: newDbRecords,
              skipDuplicates: true,
            });
          }
        } catch (error) {
          this.logger.warn(`⚠️ Lark batch create failed, falling back to 1-by-1: ${error instanceof Error ? error.message : 'Unknown'}`);
          for (let j = 0; j < createChunk.length; j++) {
            const item = createChunk[j];
            const p = payloadChunk[j];
            try {
              const res = await this.larkApiClient.createRecord(appToken, tableId, item.fields);
              createdCount++;
              await this.prisma.larkRecord.create({
                data: {
                  syncKey: p.syncKey,
                  larkAppToken: appToken,
                  larkTableId: tableId,
                  larkRecordId: res.record.record_id,
                  lastSyncedAt: new Date(),
                },
              });
            } catch (fallbackError) {
              failedCount++;
              this.logger.error(`❌ Lark individual create failed for syncKey ${item.sync_key}: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
            }
          }
        }
      }
    }

    return { created: createdCount, updated: updatedCount, failed: failedCount };
  }
}
