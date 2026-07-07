import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class LarkBotService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService);
    sendAlert(params: {
        title: string;
        shopName?: string;
        errorType: string;
        orderId?: string;
        requestId?: string;
        errorDetail: string;
        action?: string;
    }): Promise<void>;
    sendSummary(params: {
        date: string;
        totalSynced: number;
        totalCreated: number;
        totalUpdated: number;
        totalFailed: number;
    }): Promise<void>;
}
