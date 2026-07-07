import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LarkApiClient {
  private readonly logger = new Logger(LarkApiClient.name);
  private readonly baseUrl = 'https://open.larksuite.com/open-apis';

  private tenantAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // ============================================
  // Tenant Access Token (with cache)
  // ============================================

  async getTenantAccessToken(): Promise<string> {
    // Nếu token còn hạn (trừ 5 phút buffer), dùng luôn
    if (this.tenantAccessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.tenantAccessToken;
    }

    const appId = this.configService.get<string>('LARK_APP_ID');
    const appSecret = this.configService.get<string>('LARK_APP_SECRET');

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/auth/v3/tenant_access_token/internal`,
        {
          app_id: appId,
          app_secret: appSecret,
        },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Failed to get Lark tenant_access_token: ${JSON.stringify(response.data)}`,
      );
    }

    this.tenantAccessToken = response.data.tenant_access_token;
    this.tokenExpiresAt = Date.now() + (response.data.expire || 7200) * 1000;

    this.logger.log('✅ Lark tenant_access_token refreshed');
    return this.tenantAccessToken!;
  }

  // ============================================
  // Generic API helpers
  // ============================================

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getTenantAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // ============================================
  // Record CRUD
  // ============================================

  /**
   * Tìm record theo giá trị field (dùng cho search by sync_key).
   */
  async searchRecords(
    appToken: string,
    tableId: string,
    fieldName: string,
    value: string,
  ): Promise<{ items: Array<{ record_id: string; fields: Record<string, unknown> }> }> {
    const headers = await this.getHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
        {
          filter: {
            conjunction: 'and',
            conditions: [
              {
                field_name: fieldName,
                operator: 'is',
                value: [value],
              },
            ],
          },
          page_size: 1,
        },
        { headers },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Lark search failed: ${JSON.stringify(response.data)}`,
      );
    }

    return response.data.data || { items: [] };
  }

  /**
   * Tạo record mới.
   */
  async createRecord(
    appToken: string,
    tableId: string,
    fields: Record<string, unknown>,
  ): Promise<{ record: { record_id: string } }> {
    const headers = await this.getHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
        { fields },
        { headers },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Lark create record failed: ${JSON.stringify(response.data)}`,
      );
    }

    this.logger.debug(`📝 Lark record created: ${response.data.data?.record?.record_id}`);
    return response.data.data;
  }

  /**
   * Update record theo record_id.
   */
  async updateRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    const headers = await this.getHeaders();

    const response = await firstValueFrom(
      this.httpService.put(
        `${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
        { fields },
        { headers },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Lark update record failed: ${JSON.stringify(response.data)}`,
      );
    }

    this.logger.debug(`📝 Lark record updated: ${recordId}`);
  }

  /**
   * Batch tạo nhiều records.
   */
  async batchCreateRecords(
    appToken: string,
    tableId: string,
    records: Array<{ fields: Record<string, unknown> }>,
  ): Promise<{ records: Array<{ record_id: string }> }> {
    const headers = await this.getHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
        { records },
        { headers },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Lark batch create failed: ${JSON.stringify(response.data)}`,
      );
    }

    this.logger.log(`📝 Batch created ${records.length} records`);
    return response.data.data;
  }

  /**
   * Batch update nhiều records.
   */
  async batchUpdateRecords(
    appToken: string,
    tableId: string,
    records: Array<{ record_id: string; fields: Record<string, unknown> }>,
  ): Promise<void> {
    const headers = await this.getHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`,
        { records },
        { headers },
      ),
    );

    if (response.data?.code !== 0) {
      throw new Error(
        `Lark batch update failed: ${JSON.stringify(response.data)}`,
      );
    }

    this.logger.log(`📝 Batch updated ${records.length} records`);
  }
}
