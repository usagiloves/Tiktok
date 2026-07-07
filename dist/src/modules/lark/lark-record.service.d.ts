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
export declare class LarkRecordService {
    private readonly configService;
    private readonly larkApiClient;
    private readonly prisma;
    private readonly logger;
    constructor(configService: ConfigService, larkApiClient: LarkApiClient, prisma: PrismaService);
    private getAppToken;
    private getTableId;
    upsertRecord(payload: SyncRecordPayload): Promise<UpsertResult>;
}
export {};
