import { StatusMapperService } from './status-mapper.service';
export interface NormalizedData {
    syncKey: string;
    platform: string;
    shopId: string;
    brand: string;
    orderId: string;
    requestId: string | null;
    requestType: string;
    internalStatus: string;
    isComplaint: boolean;
    orderCreatedAt: Date | null;
    warehouseReceivedAt: Date | null;
    lastTiktokUpdateTime: Date | null;
    systemNote: string;
    larkFields: Record<string, unknown>;
}
export declare class NormalizerService {
    private readonly statusMapper;
    private readonly logger;
    constructor(statusMapper: StatusMapperService);
    private formatLarkDateTime;
    private buildSyncKey;
    normalizeOrder(rawOrder: Record<string, unknown>, shopId: string, brand: string): NormalizedData;
    normalizeReturn(rawReturn: Record<string, unknown>, shopId: string, brand: string, requestType?: string): NormalizedData;
}
