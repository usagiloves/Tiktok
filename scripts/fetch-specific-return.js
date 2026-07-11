const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { TiktokApiClient } = require('../dist/src/modules/tiktok/tiktok-api.client');
const { PrismaService } = require('../dist/src/common/prisma/prisma.service');
const { NormalizerService } = require('../dist/src/modules/sync/normalizer.service');
const { SyncEngineService } = require('../dist/src/modules/sync/sync-engine.service');
const { LarkRecordService } = require('../dist/src/modules/lark/lark-record.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const tiktokApi = app.get(TiktokApiClient);
  const prisma = app.get(PrismaService);
  const normalizer = app.get(NormalizerService);
  const syncEngine = app.get(SyncEngineService);
  const larkService = app.get(LarkRecordService);
  
  const targetOrderId = '584598202485605509';
  
  const shops = await prisma.shop.findMany({ where: { platform: 'TIKTOK', isActive: true } });
  
  let orderRes = null;
  let targetShop = null;
  
  for (const shop of shops) {
    console.log(`Trying shop ${shop.shopName} (${shop.shopId})...`);
    try {
      const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, targetOrderId);
      if (res && res.orders && res.orders.length > 0) {
        orderRes = res;
        targetShop = shop;
        console.log(`Order found in shop ${shop.shopName}!`);
        break;
      }
    } catch (e) {
      if (e.message && e.message.includes('does not belong to the current seller')) {
        continue;
      }
      console.log(`Error on shop ${shop.shopName}:`, e.message);
    }
  }
  
  if (!orderRes || !targetShop) {
    console.log('Order not found in any active shop!');
    process.exit(1);
  }
  
  const order = orderRes.orders[0];
  const createTime = order.create_time;
  
  let pageToken = '';
  let foundReturn = null;
  
  console.log(`Searching returns from ${new Date(createTime * 1000).toISOString()} to now in shop ${targetShop.shopName}...`);
  
  let page = 1;
  while (true) {
    const reqBody = {
      shop_cipher: targetShop.shopCipher,
      page_size: 50,
      update_time_from: createTime,
      update_time_to: Math.floor(Date.now() / 1000)
    };
    if (pageToken) reqBody.page_token = pageToken;
    
    let returnRes;
    try {
        returnRes = await tiktokApi.callApi('POST', '/return_refund/202309/returns/search', targetShop.shopId, reqBody, targetShop.platform);
    } catch(e) {
        console.error('Error fetching return page:', e.message);
        break;
    }
    
    const returnsList = returnRes?.returns || returnRes?.return_refunds || returnRes?.return_orders || [];
    
    foundReturn = returnsList.find(r => r.order_id === targetOrderId);
    if (foundReturn) {
      console.log('Found it!');
      break;
    }
    
    pageToken = returnRes?.next_page_token;
    if (!pageToken || returnsList.length === 0) {
      break;
    }
    page++;
    if (page % 5 === 0) console.log(`Searched ${page} pages...`);
  }
  
  if (foundReturn) {
    console.log(JSON.stringify(foundReturn, null, 2));
    const syncKey = 'return_' + foundReturn.return_id;
    const payload = normalizer.normalizeReturn(foundReturn, targetShop.shopId, targetShop.brand);
    const finalFields = syncEngine.stripRawFields(payload.larkFields);
    console.log("FINAL FIELDS:", JSON.stringify(finalFields, null, 2));
    
    console.log('Syncing to Lark with SyncKey:', syncKey);
    const upsertRes = await larkService.upsertRecord({
       syncKey,
       fields: finalFields
    });
    console.log('Upsert result:', upsertRes);
    
  } else {
    console.log('No return found for this order! Syncing as normal order instead.');
    const syncKey = 'order_' + order.id;
    const payload = normalizer.normalizeOrder(order, targetShop.shopId, targetShop.brand);
    const finalFields = syncEngine.stripRawFields(payload.larkFields);
    console.log("FINAL FIELDS:", JSON.stringify(finalFields, null, 2));
    const upsertRes = await larkService.upsertRecord({
       syncKey,
       fields: finalFields
    });
    console.log('Upsert result:', upsertRes);
  }
  
  await app.close();
}
bootstrap();
