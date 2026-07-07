import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TiktokTokenService } from './tiktok-token.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface TiktokApiParams {
  [key: string]: string | number | boolean | undefined;
}

export interface OrderListParams {
  shopId: string;
  shopCipher: string;
  updateTimeFrom?: number; // unix timestamp seconds
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

@Injectable()
export class TiktokApiClient {
  private readonly logger = new Logger(TiktokApiClient.name);
  private readonly baseUrl = 'https://open-api.tiktokglobalshop.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly tiktokTokenService: TiktokTokenService,
  ) {}

  // ============================================
  // Request Signing
  // ============================================

  /**
   * Tạo chữ ký cho TikTok API request.
   */
  private generateSignature(
    path: string,
    params: TiktokApiParams,
    body?: unknown,
  ): string {
    const appSecret = this.configService.get<string>('TIKTOK_APP_SECRET') ?? '';

    // Sort params alphabetically
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .filter((key) => key !== 'sign' && key !== 'access_token')
      .map((key) => `${key}${params[key]}`)
      .join('');

    const baseString =
      appSecret +
      path +
      paramString +
      (body ? JSON.stringify(body) : '') +
      appSecret;

    return crypto
      .createHmac('sha256', appSecret)
      .update(baseString)
      .digest('hex');
  }

  // ============================================
  // Generic API Call with retry
  // ============================================

  private async callApi<T>(
    method: 'GET' | 'POST',
    path: string,
    shopId: string,
    params: TiktokApiParams = {},
    body?: unknown,
    retries = 3,
  ): Promise<T> {
    const appKey = this.configService.get<string>('TIKTOK_APP_KEY') ?? '';
    const accessToken =
      await this.tiktokTokenService.getValidAccessToken(shopId);

    const timestamp = Math.floor(Date.now() / 1000);

    const allParams: TiktokApiParams = {
      app_key: appKey,
      timestamp,
      ...params,
    };

    const sign = this.generateSignature(path, allParams, body);
    allParams.sign = sign;

    const url = `${this.baseUrl}${path}`;
    const headers = {
      'content-type': 'application/json',
      'x-tts-access-token': accessToken,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await firstValueFrom(
          method === 'GET'
            ? this.httpService.get(url, { params: allParams, headers })
            : this.httpService.post(url, body, { params: allParams, headers }),
        );

        const responseData = response.data;
        if (responseData?.code !== 0) {
          throw new Error(
            `TikTok API error: code=${responseData?.code}, message=${responseData?.message}`,
          );
        }

        return responseData.data as T;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || error.message || 'Unknown error';

        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          this.logger.warn(
            `⚠️ API call failed (attempt ${attempt}/${retries}), retrying in ${backoff}ms: ${errorMessage}`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        } else {
          this.logger.error(
            `❌ API call failed after ${retries} attempts: ${errorMessage}`,
          );
          throw error;
        }
      }
    }

    throw new Error('Unreachable');
  }

  // ============================================
  // Authorization APIs
  // ============================================

  /**
   * Lấy danh sách shops đã authorize để lấy shop_cipher.
   */
  async getAuthorizedShops(shopId: string): Promise<{ shops: any[] }> {
    return this.callApi<{ shops: any[] }>(
      'GET',
      '/authorization/202309/shops',
      shopId,
    );
  }

  // ============================================
  // Order APIs
  // ============================================

  /**
   * Lấy danh sách đơn hàng theo khoảng thời gian update/create.
   */
  async getOrderList(
    params: OrderListParams,
  ): Promise<{ orders: any[]; next_page_token?: string; total_count?: number }> {
    const queryParams: TiktokApiParams = {
      shop_cipher: params.shopCipher,
      page_size: params.pageSize || 50,
    };

    if (params.pageToken) {
      queryParams.page_token = params.pageToken;
    }

    const body: Record<string, any> = {};

    if (params.updateTimeFrom) {
      body.update_time_ge = params.updateTimeFrom;
    }
    if (params.updateTimeTo) {
      body.update_time_lt = params.updateTimeTo;
    }
    if (params.createTimeFrom) {
      body.create_time_ge = params.createTimeFrom;
    }
    if (params.createTimeTo) {
      body.create_time_lt = params.createTimeTo;
    }
    if (params.orderStatus) {
      body.order_status = params.orderStatus;
    }

    return this.callApi<{
      orders: any[];
      next_page_token?: string;
      total_count?: number;
    }>('POST', '/order/202309/orders/search', params.shopId, queryParams, body);
  }

  /**
   * Lấy chi tiết đơn hàng.
   */
  async getOrderDetail(
    shopId: string,
    shopCipher: string,
    orderId: string,
  ): Promise<{ orders: any[] }> {
    return this.callApi<{ orders: any[] }>(
      'GET',
      '/order/202309/orders',
      shopId,
      { shop_cipher: shopCipher, ids: orderId },
    );
  }

  // ============================================
  // Return/Refund/Cancel APIs
  // ============================================

  /**
   * Lấy danh sách yêu cầu hoàn/trả.
   */
  async getReturnList(
    params: ReturnListParams,
  ): Promise<{
    returns?: any[];
    return_refunds?: any[];
    return_orders?: any[];
    next_page_token?: string;
    total_count?: number;
  }> {
    const queryParams: TiktokApiParams = {
      shop_cipher: params.shopCipher,
      page_size: params.pageSize || 50,
    };

    if (params.pageToken) {
      queryParams.page_token = params.pageToken;
    }

    const body: Record<string, any> = {};

    if (params.updateTimeFrom) {
      body.update_time_ge = params.updateTimeFrom;
    }
    if (params.updateTimeTo) {
      body.update_time_lt = params.updateTimeTo;
    }
    if (params.createTimeFrom) {
      body.create_time_ge = params.createTimeFrom;
    }
    if (params.createTimeTo) {
      body.create_time_lt = params.createTimeTo;
    }

    return this.callApi<{
      returns?: any[];
      return_refunds?: any[];
      return_orders?: any[];
      next_page_token?: string;
      total_count?: number;
    }>(
      'POST',
      '/return_refund/202309/returns/search',
      params.shopId,
      queryParams,
      body,
    );
  }

  /**
   * Lấy chi tiết yêu cầu hoàn/trả.
   */
  async getReturnDetail(
    shopId: string,
    shopCipher: string,
    returnId: string,
  ): Promise<any> {
    return this.callApi<any>(
      'GET',
      `/return_refund/202309/returns/${returnId}`, // Note: this path might be invalid as per preview script 404
      shopId,
      { shop_cipher: shopCipher },
    );
  }

  /**
   * Lấy danh sách đơn hủy (nếu còn dùng riêng rẽ, nếu không có thể bỏ qua).
   */
  async getCancelList(
    params: ReturnListParams,
  ): Promise<{ cancellations: any[]; nextCursor?: string }> {
    this.logger.warn('getCancelList is legacy API and may not be supported in 202309');
    throw new Error('Not implemented for 202309 API. Use order search or return search.');
  }
}
