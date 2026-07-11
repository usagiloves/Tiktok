const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { ShopeeApiClient } = require('./dist/src/modules/shopee/shopee-api.client.js');

async function main() {
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const shopeeApi = app.get(ShopeeApiClient);

  const shopId = '986665118';
  const targetSn = '260607EQDC2R56';
  
  console.log(`Trying to fetch ${targetSn} as an Order...`);
  try {
    const orderDetail = await shopeeApi.getOrderDetail(shopId, [targetSn]);
    console.log('Order Data:', JSON.stringify(orderDetail, null, 2));
  } catch(e) {
    console.error('Failed to fetch as Order:', e.message);
  }

  console.log(`\nTrying to fetch ${targetSn} as a Return...`);
  try {
    const returnDetail = await shopeeApi.getReturnDetail(shopId, targetSn);
    console.log('Return Data:', JSON.stringify(returnDetail, null, 2));
  } catch(e) {
    console.error('Failed to fetch as Return:', e.message);
  }

  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
