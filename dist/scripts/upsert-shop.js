"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const tiktok_api_client_1 = require("../src/modules/tiktok/tiktok-api.client");
const tiktok_token_service_1 = require("../src/modules/tiktok/tiktok-token.service");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const constants_1 = require("../src/common/constants");
async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }
    const prisma = new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg(databaseUrl),
    });
    const configService = new config_1.ConfigService();
    const httpService = new axios_1.HttpService();
    const tokenService = new tiktok_token_service_1.TiktokTokenService(configService, httpService, prisma);
    const apiClient = new tiktok_api_client_1.TiktokApiClient(configService, httpService, tokenService);
    const token = await prisma.tiktokToken.findFirst({
        orderBy: { updatedAt: 'desc' },
    });
    if (!token) {
        console.error('No token found. Please run OAuth first.');
        process.exit(1);
    }
    const shopId = token.shopId;
    console.log(`Found token for shopId: ${shopId}`);
    console.log('Fetching authorized shops from TikTok API...');
    const response = await apiClient.getAuthorizedShops(shopId);
    const shops = response.shops || [];
    if (shops.length === 0) {
        console.error('No authorized shops returned from API.');
        process.exit(1);
    }
    const firstShop = shops[0];
    const shopCipher = firstShop.cipher || firstShop.shop_cipher;
    const shopName = firstShop.name || 'Unknown Shop';
    const brand = shopName.replace(/\s+Vietnam$/i, '') || 'GOODFIT';
    if (!shopCipher) {
        console.error('No shop_cipher found in API response.');
        process.exit(1);
    }
    console.log(`Found shop: ${shopName}`);
    console.log(`Cipher: ${shopCipher}`);
    console.log(`Brand: ${brand}`);
    console.log('Upserting into database...');
    const upsertedShop = await prisma.shop.upsert({
        where: {
            platform_shopId: {
                platform: constants_1.PLATFORMS.TIKTOK,
                shopId: shopId,
            },
        },
        update: {
            shopName,
            brand,
            shopCipher,
            isActive: true,
        },
        create: {
            platform: constants_1.PLATFORMS.TIKTOK,
            shopId: shopId,
            shopName,
            brand,
            shopCipher,
            isActive: true,
            timezone: 'Asia/Ho_Chi_Minh',
        },
    });
    console.log('Successfully upserted shop:', upsertedShop);
    await prisma.$disconnect();
}
main().catch((error) => {
    console.error('Upsert failed:', error.message);
    if (error.response?.data) {
        console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exitCode = 1;
});
//# sourceMappingURL=upsert-shop.js.map