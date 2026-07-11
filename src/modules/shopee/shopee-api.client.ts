import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ShopeeTokenService } from './shopee-token.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopeeApiClient {
  private readonly logger = new Logger(ShopeeApiClient.name);
  private readonly baseUrl = 'https://partner.shopeemobile.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly tokenService: ShopeeTokenService,
  ) {}

  private async request(
    apiPath: string,
    shopId: string,
    method: 'GET' | 'POST',
    params: Record<string, any> = {},
    body: Record<string, any> = {},
  ): Promise<any> {
    const accessToken = await this.tokenService.getValidAccessToken(shopId);
    const partnerId = parseInt(this.configService.get<string>('SHOPEE_PARTNER_ID') || '0', 10);
    const timestamp = Math.floor(Date.now() / 1000);
    const shopIdNum = parseInt(shopId, 10);

    const sign = this.tokenService.generateSignature(apiPath, timestamp, shopIdNum, accessToken);

    const query = new URLSearchParams({
      partner_id: String(partnerId),
      timestamp: String(timestamp),
      access_token: accessToken,
      shop_id: shopId,
      sign: sign,
      ...params,
    }).toString();

    const url = `${this.baseUrl}${apiPath}?${query}`;

    try {
      let response;
      if (method === 'GET') {
        response = await firstValueFrom(this.httpService.get(url));
      } else {
        response = await firstValueFrom(this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      if (response.data.error) {
        throw new Error(`Shopee API Error [${response.data.error}]: ${response.data.message}`);
      }

      return response.data.response;
    } catch (error: any) {
      this.logger.error(`❌ Shopee API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * API: v2.order.get_order_list
   */
  async getOrderList(
    shopId: string,
    timeFrom: number,
    timeTo: number,
    cursor: string = '',
  ): Promise<{ order_sn_list: string[]; next_cursor: string; more: boolean }> {
    const data = await this.request('/api/v2/order/get_order_list', shopId, 'GET', {
      time_range_field: 'update_time',
      time_from: timeFrom,
      time_to: timeTo,
      page_size: 100,
      cursor: cursor,
    });
    
    return {
      order_sn_list: data.order_list?.map((o: any) => o.order_sn) || [],
      next_cursor: data.next_cursor || '',
      more: data.more || false,
    };
  }

  /**
   * API: v2.order.get_order_detail
   */
  async getOrderDetail(shopId: string, orderSnList: string[]): Promise<any[]> {
    if (orderSnList.length === 0) return [];
    
    const data = await this.request('/api/v2/order/get_order_detail', shopId, 'GET', {
      order_sn_list: orderSnList.join(','),
      response_optional_fields: 'buyer_user_id,buyer_username,estimated_shipping_fee,recipient_address,actual_shipping_fee,goods_to_declare,note,note_update_time,item_list,pay_time,dropshipper,dropshipper_phone,split_up,buyer_cancel_reason,cancel_by,cancel_reason,actual_shipping_fee_confirmed,buyer_cpf_id,fulfillment_flag,pickup_done_time,package_list,shipping_carrier,payment_method,total_amount,buyer_remark,checkout_shipping_carrier,reverse_shipping_fee,order_chargeable_weight_gram',
    });
    
    return data.order_list || [];
  }

  /**
   * Lấy toàn bộ order detail theo update_time (gom tự động)
   */
  async getUpdatedOrders(shopId: string, timeFrom: number, timeTo: number): Promise<any[]> {
    let hasMore = true;
    let cursor = '';
    const allOrderSns: string[] = [];

    while (hasMore) {
      const result = await this.getOrderList(shopId, timeFrom, timeTo, cursor);
      if (result.order_sn_list.length > 0) {
        allOrderSns.push(...result.order_sn_list);
      }
      hasMore = result.more;
      cursor = result.next_cursor;
    }

    // Lấy detail mỗi 50 items
    const orderDetails: any[] = [];
    for (let i = 0; i < allOrderSns.length; i += 50) {
      const batchSns = allOrderSns.slice(i, i + 50);
      const details = await this.getOrderDetail(shopId, batchSns);
      orderDetails.push(...details);
    }

    return orderDetails;
  }

  /**
   * API: v2.returns.get_return_list
   */
  async getReturnList(
    shopId: string,
    timeFrom: number,
    timeTo: number,
    pageNo: number = 0,
  ): Promise<any> {
    const data = await this.request('/api/v2/returns/get_return_list', shopId, 'GET', {
      time_from: timeFrom,
      time_to: timeTo,
      page_no: pageNo,
      page_size: 100,
    });
    
    return {
      return_list: data.return || [],
      more: data.more || false,
    };
  }

  /**
   * API: v2.returns.get_return_detail
   */
  async getReturnDetail(shopId: string, returnSn: string): Promise<any> {
    const data = await this.request('/api/v2/returns/get_return_detail', shopId, 'GET', {
      return_sn: returnSn,
    });
    return data;
  }
}
