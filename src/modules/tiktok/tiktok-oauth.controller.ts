import {
  Controller,
  Get,
  Query,
  Res,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { TiktokTokenService } from './tiktok-token.service';
import * as crypto from 'crypto';

@Controller('tiktok/oauth')
export class TiktokOAuthController {
  private readonly logger = new Logger(TiktokOAuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tiktokTokenService: TiktokTokenService,
  ) {}

  /**
   * GET /tiktok/oauth/authorize
   * Sinh authorization URL và redirect user sang TikTok để cấp quyền.
   * Hỗ trợ cả local (ngrok) và production URL.
   */
  @Get('authorize')
  authorize(@Res() res: Response) {
    const appKey = this.configService.get<string>('TIKTOK_APP_KEY');
    const redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI');
    const stateSecret = this.configService.get<string>('OAUTH_STATE_SECRET');

    // Sinh state ngẫu nhiên để chống CSRF
    const state = crypto
      .createHmac('sha256', stateSecret ?? 'default-secret')
      .update(Date.now().toString())
      .digest('hex')
      .substring(0, 32);

    // Lưu state tạm (trong production nên lưu Redis với TTL)
    this.tiktokTokenService.saveOAuthState(state);

    const authUrl =
      `https://auth.tiktok-shops.com/oauth/authorize` +
      `?app_key=${appKey}` +
      `&redirect_uri=${encodeURIComponent(redirectUri ?? '')}` +
      `&state=${state}`;

    this.logger.log(`🔗 Redirecting to TikTok OAuth: ${authUrl}`);
    res.redirect(authUrl);
  }

  /**
   * GET /tiktok/oauth/callback
   * Nhận callback từ TikTok sau khi seller cấp quyền.
   * Hoạt động trên cả localhost (qua ngrok) và production domain.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📥 OAuth callback received. code=${code}, state=${state}`);

    // 1. Verify state
    if (!this.tiktokTokenService.verifyOAuthState(state)) {
      this.logger.error('❌ Invalid OAuth state');
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter. Possible CSRF attack.',
      });
    }

    try {
      // 2. Đổi auth_code lấy access_token + refresh_token
      const tokenData = await this.tiktokTokenService.exchangeCodeForToken(code);

      this.logger.log(
        `✅ Token obtained for shop: ${tokenData.shopId}`,
      );

      // 3. Trả response thành công
      return res.status(200).json({
        success: true,
        message: 'Cấp quyền TikTok Shop thành công!',
        data: {
          shopId: tokenData.shopId,
          shopName: tokenData.shopName,
          accessTokenExpiresAt: tokenData.accessTokenExpiredAt,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ OAuth callback error: ${errorMessage}`);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy token TikTok Shop.',
        error: errorMessage,
      });
    }
  }
}
