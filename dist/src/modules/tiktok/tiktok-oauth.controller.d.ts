import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { TiktokTokenService } from './tiktok-token.service';
export declare class TiktokOAuthController {
    private readonly configService;
    private readonly tiktokTokenService;
    private readonly logger;
    constructor(configService: ConfigService, tiktokTokenService: TiktokTokenService);
    private getRedirectUri;
    getRedirectUrl(): {
        success: boolean;
        redirectUri: string;
        callbackPath: string;
        authorizeEndpoint: string;
    };
    authorize(res: Response): void;
    callback(code: string, state: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
