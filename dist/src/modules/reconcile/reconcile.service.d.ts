import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { SyncEngineService } from '../sync/sync-engine.service';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ReconcileService {
    private readonly tiktokApi;
    private readonly syncEngine;
    private readonly larkBot;
    private readonly prisma;
    private readonly logger;
    constructor(tiktokApi: TiktokApiClient, syncEngine: SyncEngineService, larkBot: LarkBotService, prisma: PrismaService);
    reconcileOrders(shopId: string, fromTimestamp: number, toTimestamp: number): Promise<{
        total: number;
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    }>;
    reconcileReturns(shopId: string, fromTimestamp: number, toTimestamp: number): Promise<{
        total: number;
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    }>;
    private detectRequestType;
}
