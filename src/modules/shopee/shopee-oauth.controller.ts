import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ShopeeTokenService } from './shopee-token.service';

@Controller('shopee/oauth')
export class ShopeeOAuthController {
  private readonly logger = new Logger(ShopeeOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly shopeeTokenService: ShopeeTokenService,
  ) {}

  private getRedirectUri(): string {
    const configuredRedirectUri = this.configService.get<string>('SHOPEE_REDIRECT_URI');
    if (configuredRedirectUri) return configuredRedirectUri;

    const appBaseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
    return `${appBaseUrl.replace(/\/$/, '')}/shopee/oauth/callback`;
  }

  /**
   * GET /shopee/oauth/redirect-url
   * Trả về URL để seller click vào cấp quyền.
   */
  @Get('redirect-url')
  getRedirectUrl() {
    const partnerId = this.configService.get<string>('SHOPEE_PARTNER_ID');
    const redirectUri = this.getRedirectUri();
    const apiPath = '/api/v2/shop/auth_partner';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.shopeeTokenService.generateSignature(apiPath, timestamp);

    const authUrl = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUri)}`;

    return {
      success: true,
      authUrl,
    };
  }

  /**
   * GET /shopee/oauth/authorize
   * Sinh URL và redirect
   */
  @Get('authorize')
  authorize(@Res() res: Response) {
    const data = this.getRedirectUrl();
    this.logger.log(`🔗 Redirecting to Shopee OAuth: ${data.authUrl}`);
    res.redirect(data.authUrl);
  }

  /**
   * GET /shopee/oauth/callback
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('shop_id') shopId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📥 Shopee OAuth callback received. code=${code}, shop_id=${shopId}`);

    if (!code || !shopId) {
       return res.status(400).json({ success: false, message: 'Missing code or shop_id' });
    }

    try {
      const tokenData = await this.shopeeTokenService.exchangeCodeForToken(code, parseInt(shopId, 10));

      this.logger.log(`✅ Shopee Token obtained for shop: ${tokenData.shopId}`);

      return res.status(200).json({
        success: true,
        message: 'Cấp quyền Shopee thành công!',
        data: {
          shopId: tokenData.shopId,
          accessTokenExpiresAt: tokenData.accessTokenExpiredAt,
        },
      });
    } catch (error: any) {
      this.logger.error(`❌ Shopee OAuth callback error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy token Shopee.',
        error: error.message,
      });
    }
  }
}
