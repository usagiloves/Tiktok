export declare class StatusMapperService {
    private readonly logger;
    mapOrderStatus(tiktokStatus: string): string;
    mapReturnStatus(tiktokStatus: string): string;
    mapRequestType(requestType: string): string;
    isComplaint(tiktokData: Record<string, unknown>): boolean;
}
