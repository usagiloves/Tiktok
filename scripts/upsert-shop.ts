import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TiktokApiClient } from '../src/modules/tiktok/tiktok-api.client';
import { TiktokTokenService } from '../src/modules/tiktok/tiktok-token.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PLATFORMS } from '../src/common/constants';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });

  const configService = new ConfigService();
  const httpService = new HttpService();
  const tokenService = new TiktokTokenService(configService, httpService, prisma as any);
  
  // Note: we inject dependencies manually here since it's a script without Nest context
  const apiClient = new TiktokApiClient(configService, httpService, tokenService);

  // 1. Get a token to find the shopId
  const token = await prisma.tiktokToken.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (!token) {
    console.error('No token found. Please run OAuth first.');
    process.exit(1);
  }

  const shopId = token.shopId;
  console.log(`Found token for shopId: ${shopId}`);

  // 2. Fetch authorized shops
  console.log('Fetching authorized shops from TikTok API...');
  const response = await apiClient.getAuthorizedShops(shopId);
  const shops = response.shops || [];

  if (shops.length === 0) {
    console.error('No authorized shops returned from API.');
    process.exit(1);
  }

  const firstShop = shops[0];
  const shopCipher = firstShop.cipher || firstShop.shop_cipher;
  const shopCode = firstShop.code || firstShop.shop_code || null;
  const shopName = firstShop.name || 'Unknown Shop';
  // Attempt to parse brand from shop name (e.g., "GOODFIT Vietnam" -> "GOODFIT")
  const brand = shopName.replace(/\s+Vietnam$/i, '') || 'GOODFIT';

  if (!shopCipher) {
    console.error('No shop_cipher found in API response.');
    process.exit(1);
  }

  console.log(`Found shop: ${shopName}`);
  console.log(`Code: ${shopCode}`);
  console.log(`Cipher: ${shopCipher}`);
  console.log(`Brand: ${brand}`);

  // 3. Upsert into database
  console.log('Upserting into database...');
  const upsertedShop = await prisma.shop.upsert({
    where: {
      platform_shopId: {
        platform: PLATFORMS.TIKTOK,
        shopId: shopId,
      },
    },
    update: {
      shopName,
      shopCode,
      brand,
      shopCipher,
      isActive: true,
    },
    create: {
      platform: PLATFORMS.TIKTOK,
      shopId: shopId,
      shopName,
      shopCode,
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
