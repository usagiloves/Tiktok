import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
export declare class TiktokWebhookController {
    private readonly configService;
    private readonly prisma;
    private readonly syncQueue;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, syncQueue: Queue);
    private verifySignature;
    handleOrderStatus(body: Record<string, unknown>, signature: string | undefined): Promise<{
        code: number;
        message: string;
    }>;
    handleReturnStatus(body: Record<string, unknown>, signature: string | undefined): Promise<{
        code: number;
        message: string;
    }>;
}
