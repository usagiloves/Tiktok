import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as qs from 'qs';

@Injectable()
export class JtExpressClient {
  private readonly logger = new Logger(JtExpressClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gọi API trace của J&T
   */
  async trace(txlogisticId: string, billCodes: string[]): Promise<any> {
    if (!billCodes || billCodes.length === 0) return null;

    const isEnabled = this.configService.get<string>('JT_ENABLED') === 'true';
    if (!isEnabled) {
      this.logger.debug('J&T is disabled via JT_ENABLED');
      return null;
    }

    const baseUrl = this.configService.get<string>('JT_API_BASE_URL');
    const apiAccount = this.configService.get<string>('JT_API_ACCOUNT');
    const customerCode = this.configService.get<string>('JT_CUSTOMER_CODE');
    const password = this.configService.get<string>('JT_PASSWORD');
    const privateKey = this.configService.get<string>('JT_PRIVATE_KEY');

    if (!baseUrl || !apiAccount || !privateKey) {
      this.logger.warn('J&T config is missing (baseUrl, apiAccount, privateKey)');
      return null;
    }

    const bizContentObj = {
      customerCode: customerCode || '',
      password: password || '',
      txlogisticId: txlogisticId || billCodes[0], // Dùng billcode nếu không có txlogisticId
      billcodes: billCodes.join(','),
    };
    const bizContent = JSON.stringify(bizContentObj);

    const timestamp = Date.now().toString();

    // Digest: Base64(MD5(bizContent + privateKey))
    const md5Str = bizContent + privateKey;
    const digest = crypto.createHash('md5').update(md5Str, 'utf8').digest('base64');

    try {
      this.logger.debug(`Calling J&T trace for billCodes: ${billCodes.join(',')}`);
      const response = await firstValueFrom(
        this.httpService.post(
          baseUrl,
          qs.stringify({ bizContent }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'apiAccount': apiAccount,
              'digest': digest,
              'timestamp': timestamp,
            },
            timeout: 10000,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ J&T trace API error for ${billCodes.join(',')}: ${error.message}`);
      return null;
    }
  }
}
