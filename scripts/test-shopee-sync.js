const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { SyncEngineService } = require('./dist/src/modules/sync/sync-engine.service.js');
const { ShopeeApiClient } = require('./dist/src/modules/shopee/shopee-api.client.js');

async function main() {
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncEngine = app.get(SyncEngineService);
  const shopeeApi = app.get(ShopeeApiClient);

  const shopId = '986665118';
  
  // 1. Fetch return detail for 2305270RKKMVHFD
  console.log('Fetching return detail from Shopee...');
  const detail = await shopeeApi.getReturnDetail(shopId, '2305270RKKMVHFD');
  
  if (!detail) {
    console.log('Failed to fetch detail');
    process.exit(1);
  }

  // 2. Modify timestamp to bypass SYNC_MIN_DATE
  const now = Math.floor(Date.now() / 1000);
  detail.create_time = now;
  detail.update_time = now;
  if (detail.order_create_time) detail.order_create_time = now;

  const shopMeta = {
    shopId,
    brand: 'TEST_BRAND',
    shopCode: 'TEST_CODE',
    platform: 'SHOPEE',
  };

  // 3. Sync
  console.log('Syncing return to Lark...');
  const stats = await syncEngine.syncReturnsBatch([detail], shopMeta, 'RETURN', 'MANUAL_TEST');
  
  console.log('Sync result:', stats);
  
  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
