import { PrismaService } from '../../common/prisma/prisma.service';
import { LarkRecordService } from '../lark/lark-record.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { NormalizerService } from './normalizer.service';
export declare class SyncEngineService {
    private readonly prisma;
    private readonly larkRecordService;
    private readonly larkBotService;
    private readonly normalizerService;
    private readonly logger;
    constructor(prisma: PrismaService, larkRecordService: LarkRecordService, larkBotService: LarkBotService, normalizerService: NormalizerService);
    syncOrder(rawOrder: Record<string, unknown>, shopId: string, brand: string, source: string): Promise<{
        action: string;
        syncKey: string;
    }>;
    syncReturn(rawReturn: Record<string, unknown>, shopId: string, brand: string, requestType: string, source: string): Promise<{
        action: string;
        syncKey: string;
    }>;
    private processNormalizedData;
    private logSync;
    retrySyncBySyncKey(syncKey: string): Promise<{
        action: string;
    }>;
}
