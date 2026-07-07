import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class LarkApiClient {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly baseUrl;
    private tenantAccessToken;
    private tokenExpiresAt;
    constructor(configService: ConfigService, httpService: HttpService);
    getTenantAccessToken(): Promise<string>;
    private getHeaders;
    searchRecords(appToken: string, tableId: string, fieldName: string, value: string): Promise<{
        items: Array<{
            record_id: string;
            fields: Record<string, unknown>;
        }>;
    }>;
    createRecord(appToken: string, tableId: string, fields: Record<string, unknown>): Promise<{
        record: {
            record_id: string;
        };
    }>;
    updateRecord(appToken: string, tableId: string, recordId: string, fields: Record<string, unknown>): Promise<void>;
    batchCreateRecords(appToken: string, tableId: string, records: Array<{
        fields: Record<string, unknown>;
    }>): Promise<{
        records: Array<{
            record_id: string;
        }>;
    }>;
    batchUpdateRecords(appToken: string, tableId: string, records: Array<{
        record_id: string;
        fields: Record<string, unknown>;
    }>): Promise<void>;
}
