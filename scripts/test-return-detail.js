const { PrismaClient } = require('@prisma/client');
const { TiktokApiClient } = require('../src/modules/tiktok/tiktok-api.client');

async function test() {
  const prisma = new PrismaClient();
  const shopId = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q';
  
  const token = await prisma.tiktokToken.findUnique({ where: { shopId } });
  if (!token) throw new Error('Token not found');

  const shop = await prisma.shop.findUnique({ where: { platform_shopId: { platform: 'TIKTOK', shopId } } });
  if (!shop) throw new Error('Shop not found');

  const client = new TiktokApiClient();
  
  const orderId = '584886615628940289';
  console.log(`Fetching returns for order: ${orderId}`);
  
  const res = await client.searchReturns(
    shop.shopCipher,
    token.accessToken,
    Math.floor(Date.now() / 1000) - 30 * 86400,
    Math.floor(Date.now() / 1000),
    orderId
  );
  
  console.log(JSON.stringify(res.data, null, 2));
  await prisma.$disconnect();
}

test().catch(console.error);
