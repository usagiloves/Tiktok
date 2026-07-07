import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TiktokTokenService } from './tiktok-token.service';
export interface OrderListParams {
    shopId: string;
    shopCipher: string;
    updateTimeFrom?: number;
    updateTimeTo?: number;
    createTimeFrom?: number;
    createTimeTo?: number;
    pageSize?: number;
    pageToken?: string;
    orderStatus?: string;
}
export interface ReturnListParams {
    shopId: string;
    shopCipher: string;
    updateTimeFrom?: number;
    updateTimeTo?: number;
    createTimeFrom?: number;
    createTimeTo?: number;
    pageSize?: number;
    pageToken?: string;
}
export declare class TiktokApiClient {
    private readonly configService;
    private readonly httpService;
    private readonly tiktokTokenService;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService, tiktokTokenService: TiktokTokenService);
    private generateSignature;
    private callApi;
    getAuthorizedShops(shopId: string): Promise<{
        shops: any[];
    }>;
    getOrderList(params: OrderListParams): Promise<{
        orders: any[];
        next_page_token?: string;
        total_count?: number;
    }>;
    getOrderDetail(shopId: string, shopCipher: string, orderId: string): Promise<{
        orders: any[];
    }>;
    getReturnList(params: ReturnListParams): Promise<{
        returns?: any[];
        return_refunds?: any[];
        return_orders?: any[];
        next_page_token?: string;
        total_count?: number;
    }>;
    getReturnDetail(shopId: string, shopCipher: string, returnId: string): Promise<any>;
    getCancelList(params: ReturnListParams): Promise<{
        cancellations: any[];
        nextCursor?: string;
    }>;
}
