import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SyncEngineService } from './sync-engine.service';
import { TiktokApiClient } from '../tiktok/tiktok-api.client';
import { LarkBotService } from '../lark/lark-bot.service';
import { PrismaService } from '../../common/prisma/prisma.service';
interface SyncJobData {
    orderId?: string;
    returnId?: string;
    shopId: string;
    eventType: string;
    source: string;
}
export declare class SyncWorker extends WorkerHost {
    private readonly syncEngine;
    private readonly tiktokApi;
    private readonly larkBot;
    private readonly prisma;
    private readonly logger;
    constructor(syncEngine: SyncEngineService, tiktokApi: TiktokApiClient, larkBot: LarkBotService, prisma: PrismaService);
    process(job: Job<SyncJobData>): Promise<unknown>;
    private processOrder;
    private processReturn;
    private detectRequestType;
}
export {};
