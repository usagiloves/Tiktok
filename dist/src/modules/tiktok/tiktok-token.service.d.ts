import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
interface TokenExchangeResult {
    shopId: string;
    shopName: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiredAt: Date;
    refreshTokenExpiredAt: Date;
}
export declare class TiktokTokenService {
    private readonly configService;
    private readonly httpService;
    private readonly prisma;
    private readonly logger;
    private oauthStates;
    constructor(configService: ConfigService, httpService: HttpService, prisma: PrismaService);
    saveOAuthState(state: string): void;
    verifyOAuthState(state: string): boolean;
    exchangeCodeForToken(code: string): Promise<TokenExchangeResult>;
    refreshAccessToken(shopId: string): Promise<string>;
    getValidAccessToken(shopId: string): Promise<string>;
}
export {};
