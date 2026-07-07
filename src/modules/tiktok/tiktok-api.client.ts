import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TiktokTokenService } from './tiktok-token.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface TiktokApiParams {
  [key: string]: string | number | boolean | undefined;
}

interface OrderListParams {
  shopId: string;
  updateTimeFrom?: number; // unix timestamp seconds
  updateTimeTo?: number;
  pageSize?: number;
  cursor?: string;
  orderStatus?: string;
}

interface ReturnListParams {
  shopId: string;
  updateTimeFrom?: number;
  updateTimeTo?: number;
  pageSize?: number;
  cursor?: string;
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
   * TikTok yêu cầu sign request bằng app_secret.
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
      shop_id: shopId,
      ...params,
    };

    const sign = this.generateSignature(path, allParams, body);
    allParams.sign = sign;
    allParams.access_token = accessToken;

    const url = `${this.baseUrl}${path}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await firstValueFrom(
          method === 'GET'
            ? this.httpService.get(url, { params: allParams })
            : this.httpService.post(url, body, { params: allParams }),
        );

        const responseData = response.data;
        if (responseData?.code !== 0) {
          throw new Error(
            `TikTok API error: code=${responseData?.code}, message=${responseData?.message}`,
          );
        }

        return responseData.data as T;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

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
  // Order APIs
  // ============================================

  /**
   * Lấy danh sách đơn hàng theo khoảng thời gian update.
   */
  async getOrderList(
    params: OrderListParams,
  ): Promise<{ orders: unknown[]; nextCursor?: string; totalCount?: number }> {
    const queryParams: TiktokApiParams = {
      page_size: params.pageSize || 50,
    };

    if (params.updateTimeFrom) {
      queryParams.update_time_from = params.updateTimeFrom;
    }
    if (params.updateTimeTo) {
      queryParams.update_time_to = params.updateTimeTo;
    }
    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }
    if (params.orderStatus) {
      queryParams.order_status = params.orderStatus;
    }

    return this.callApi<{
      orders: unknown[];
      nextCursor?: string;
      totalCount?: number;
    }>('POST', '/api/orders/search', params.shopId, {}, queryParams);
  }

  /**
   * Lấy chi tiết đơn hàng.
   */
  async getOrderDetail(
    shopId: string,
    orderId: string,
  ): Promise<unknown> {
    return this.callApi<unknown>(
      'POST',
      '/api/orders/detail/query',
      shopId,
      {},
      { order_id_list: [orderId] },
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
    return_refunds: unknown[];
    nextCursor?: string;
    totalCount?: number;
  }> {
    const queryParams: TiktokApiParams = {
      page_size: params.pageSize || 50,
    };

    if (params.updateTimeFrom) {
      queryParams.update_time_from = params.updateTimeFrom;
    }
    if (params.updateTimeTo) {
      queryParams.update_time_to = params.updateTimeTo;
    }
    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }

    return this.callApi<{
      return_refunds: unknown[];
      nextCursor?: string;
      totalCount?: number;
    }>('GET', '/api/reverse/list', params.shopId, queryParams);
  }

  /**
   * Lấy chi tiết yêu cầu hoàn/trả.
   */
  async getReturnDetail(
    shopId: string,
    returnId: string,
  ): Promise<unknown> {
    return this.callApi<unknown>(
      'GET',
      '/api/reverse/detail',
      shopId,
      { reverse_order_id: returnId },
    );
  }

  /**
   * Lấy danh sách đơn hủy.
   */
  async getCancelList(
    params: ReturnListParams,
  ): Promise<{ cancellations: unknown[]; nextCursor?: string }> {
    const queryParams: TiktokApiParams = {
      page_size: params.pageSize || 50,
    };

    if (params.updateTimeFrom) {
      queryParams.update_time_from = params.updateTimeFrom;
    }
    if (params.updateTimeTo) {
      queryParams.update_time_to = params.updateTimeTo;
    }
    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }

    return this.callApi<{ cancellations: unknown[]; nextCursor?: string }>(
      'GET',
      '/api/reverse/cancel/list',
      params.shopId,
      queryParams,
    );
  }
}
