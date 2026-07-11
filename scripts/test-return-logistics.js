const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { TiktokApiClient } = require('../dist/src/modules/tiktok/tiktok-api.client');
const { PrismaService } = require('../dist/src/common/prisma/prisma.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const tiktokApi = app.get(TiktokApiClient);
  const prisma = app.get(PrismaService);
  const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
  
  try {
    const returnId = '4041133123427927078';
    console.log('Fetching tracking for return:', returnId);
    const res = await tiktokApi.callApi('GET', `/logistics/202309/orders/584604637021898072/tracking`, shop.shopId, { shop_cipher: shop.shopCipher });
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
  
  await app.close();
  process.exit(0);
}
test();
