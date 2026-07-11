const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { TiktokApiClient } = require('../dist/src/modules/tiktok/tiktok-api.client');
const { PrismaService } = require('../dist/src/common/prisma/prisma.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const tiktokApi = app.get(TiktokApiClient);
  const prisma = app.get(PrismaService);
  
  const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
  
  const orderId = '584604637021898072';
  console.log('Fetching order...');
  const orderRes = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, orderId);
  console.log('Order:', JSON.stringify(orderRes, null, 2));
  
  console.log('Fetching return...');
  const returnRes = await tiktokApi.callApi('POST', '/return_refund/202309/returns/search', shop.shopId, {
     shop_cipher: shop.shopCipher,
     page_size: 10,
     order_id: orderId
  }, shop.platform);
  console.log('Return:', JSON.stringify(returnRes, null, 2));
  
  await app.close();
}
bootstrap();
