import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

interface TokenExchangeResult {
  shopId: string;
  shopName: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiredAt: Date;
  refreshTokenExpiredAt: Date;
}

@Injectable()
export class TiktokTokenService {
  private readonly logger = new Logger(TiktokTokenService.name);
  private oauthStates: Set<string> = new Set();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // OAuth State Management
  // ============================================

  saveOAuthState(state: string): void {
    this.oauthStates.add(state);
    // Tự xóa sau 10 phút
    setTimeout(() => this.oauthStates.delete(state), 10 * 60 * 1000);
  }

  verifyOAuthState(state: string): boolean {
    if (this.oauthStates.has(state)) {
      this.oauthStates.delete(state);
      return true;
    }
    return false;
  }

  // ============================================
  // Token Exchange
  // ============================================

  /**
   * Đổi auth_code lấy access_token và refresh_token từ TikTok.
   */
  async exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
    const appKey = this.configService.get<string>('TIKTOK_APP_KEY');
    const appSecret = this.configService.get<string>('TIKTOK_APP_SECRET');

    const url = 'https://auth.tiktok-shops.com/api/v2/token/get';

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          app_key: appKey,
          app_secret: appSecret,
          auth_code: code,
          grant_type: 'authorized_code',
        },
      }),
    );

    const data = response.data?.data;
    if (!data?.access_token) {
      throw new Error(
        `TikTok token exchange failed: ${JSON.stringify(response.data)}`,
      );
    }

    const result: TokenExchangeResult = {
      shopId: data.open_id || data.seller_id || 'unknown',
      shopName: data.seller_name || 'TikTok Shop',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiredAt: new Date(
        Date.now() + (data.access_token_expire_in || 0) * 1000,
      ),
      refreshTokenExpiredAt: new Date(
        Date.now() + (data.refresh_token_expire_in || 0) * 1000,
      ),
    };

    // Lưu vào database (upsert) Token
    await this.prisma.tiktokToken.upsert({
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

    // Đồng thời tạo Shop nếu chưa có để hệ thống nhận diện
    await this.prisma.shop.upsert({
      where: { platform_shopId: { platform: 'TIKTOK', shopId: result.shopId } },
      update: {
        shopName: result.shopName,
      },
      create: {
        shopId: result.shopId,
        shopName: result.shopName,
        platform: 'TIKTOK',
        isActive: true,
        brand: result.shopName,
        shopCipher: 'none',
        shopCode: result.shopName.substring(0, 5).toUpperCase(),
      }
    });

    this.logger.log(`✅ Token and Shop saved for: ${result.shopId}`);

    return result;
  }

  // ============================================
  // Token Refresh
  // ============================================

  /**
   * Refresh access_token khi gần hết hạn.
   */
  async refreshAccessToken(shopId: string): Promise<string> {
    const token = await this.prisma.tiktokToken.findUnique({
      where: { shopId },
    });

    if (!token) {
      throw new Error(`No token found for shop: ${shopId}`);
    }

    const appKey = this.configService.get<string>('TIKTOK_APP_KEY');
    const appSecret = this.configService.get<string>('TIKTOK_APP_SECRET');

    const url = 'https://auth.tiktok-shops.com/api/v2/token/refresh';

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          app_key: appKey,
          app_secret: appSecret,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token',
        },
      }),
    );

    const data = response.data?.data;
    if (!data?.access_token) {
      throw new Error(
        `TikTok token refresh failed for shop ${shopId}: ${JSON.stringify(response.data)}`,
      );
    }

    await this.prisma.tiktokToken.update({
      where: { shopId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpiredAt: new Date(
          Date.now() + (data.access_token_expire_in || 0) * 1000,
        ),
        refreshTokenExpiredAt: new Date(
          Date.now() + (data.refresh_token_expire_in || 0) * 1000,
        ),
      },
    });

    this.logger.log(`🔄 Token refreshed for shop: ${shopId}`);
    return data.access_token;
  }

  // ============================================
  // Get Valid Token
  // ============================================

  /**
   * Lấy access_token hợp lệ. Tự refresh nếu gần hết hạn (< 5 phút).
   */
  async getValidAccessToken(shopId: string): Promise<string> {
    const token = await this.prisma.tiktokToken.findUnique({
      where: { shopId },
    });

    if (!token) {
      throw new Error(`No token found for shop: ${shopId}`);
    }

    // Nếu token còn hơn 5 phút, dùng luôn
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (
      token.accessTokenExpiredAt &&
      token.accessTokenExpiredAt > fiveMinutesFromNow
    ) {
      return token.accessToken;
    }

    // Token gần hết hạn hoặc đã hết hạn → refresh
    this.logger.warn(`⏰ Token expiring soon for shop ${shopId}, refreshing...`);
    return this.refreshAccessToken(shopId);
  }
}
