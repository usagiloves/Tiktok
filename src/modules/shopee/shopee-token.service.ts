import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface TokenExchangeResult {
  shopId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiredAt: Date;
  refreshTokenExpiredAt: Date;
}

@Injectable()
export class ShopeeTokenService {
  private readonly logger = new Logger(ShopeeTokenService.name);
  private readonly baseUrl = 'https://partner.shopeemobile.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  private getPartnerId(): number {
    return parseInt(this.configService.get<string>('SHOPEE_PARTNER_ID') || '0', 10);
  }

  private getPartnerKey(): string {
    return this.configService.get<string>('SHOPEE_PARTNER_KEY') || '';
  }

  /**
   * Sinh chữ ký HMAC-SHA256 theo chuẩn Shopee Open API v2
   */
  public generateSignature(apiPath: string, timestamp: number, shopId?: number, accessToken?: string): string {
    const partnerId = this.getPartnerId();
    const partnerKey = this.getPartnerKey();
    
    // Format: partner_id, api_path, timestamp, access_token, shop_id
    let baseString = `${partnerId}${apiPath}${timestamp}`;
    if (accessToken) baseString += accessToken;
    if (shopId) baseString += shopId;

    return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
  }

  /**
   * Đổi auth_code lấy access_token
   */
  async exchangeCodeForToken(code: string, shopId: number): Promise<TokenExchangeResult> {
    const partnerId = this.getPartnerId();
    const apiPath = '/api/v2/auth/token/get';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSignature(apiPath, timestamp);

    const url = `${this.baseUrl}${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const body = {
      code,
      shop_id: shopId,
      partner_id: partnerId,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      }));

      const data = response.data;
      if (data.error) {
        throw new Error(`Shopee token exchange failed: ${JSON.stringify(data)}`);
      }

      const result: TokenExchangeResult = {
        shopId: String(shopId),
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpiredAt: new Date(Date.now() + (data.expire_in || 0) * 1000),
        refreshTokenExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Shopee refresh_token usually valid for 30 days
      };

      await this.prisma.shopeeToken.upsert({
        where: { shopId: result.shopId },
        update: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiredAt: result.accessTokenExpiredAt,
          refreshTokenExpiredAt: result.refreshTokenExpiredAt,
        },
        create: {
          shopId: result.shopId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiredAt: result.accessTokenExpiredAt,
          refreshTokenExpiredAt: result.refreshTokenExpiredAt,
        },
      });

      this.logger.log(`💾 Shopee Token saved for shop: ${result.shopId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Shopee exchange token error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshAccessToken(shopId: string): Promise<string> {
    const token = await this.prisma.shopeeToken.findUnique({
      where: { shopId },
    });

    if (!token) throw new Error(`No token found for shopee shop: ${shopId}`);

    const partnerId = this.getPartnerId();
    const apiPath = '/api/v2/auth/access_token/get';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSignature(apiPath, timestamp);

    const url = `${this.baseUrl}${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const body = {
      refresh_token: token.refreshToken,
      shop_id: parseInt(shopId, 10),
      partner_id: partnerId,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      }));

      const data = response.data;
      if (data.error) {
        throw new Error(`Shopee token refresh failed: ${JSON.stringify(data)}`);
      }

      await this.prisma.shopeeToken.update({
        where: { shopId },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          accessTokenExpiredAt: new Date(Date.now() + (data.expire_in || 0) * 1000),
          refreshTokenExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(`🔄 Shopee Token refreshed for shop: ${shopId}`);
      return data.access_token;
    } catch (error: any) {
      this.logger.error(`❌ Shopee refresh token error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Valid Token (auto refresh if expired)
   */
  async getValidAccessToken(shopId: string): Promise<string> {
    const token = await this.prisma.shopeeToken.findUnique({
      where: { shopId },
    });

    if (!token) {
      throw new Error(`No token found for shopee shop: ${shopId}`);
    }

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (token.accessTokenExpiredAt && token.accessTokenExpiredAt > fiveMinutesFromNow) {
      return token.accessToken;
    }

    this.logger.warn(`⏰ Shopee token expiring soon for shop ${shopId}, refreshing...`);
    return this.refreshAccessToken(shopId);
  }
}
