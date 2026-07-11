const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { NormalizerService } = require('../dist/src/modules/sync/normalizer.service');
const { LarkRecordService } = require('../dist/src/modules/lark/lark-record.service');
const { TiktokApiClient } = require('../dist/src/modules/tiktok/tiktok-api.client');
const { PrismaService } = require('../dist/src/common/prisma/prisma.service');
const { SyncEngineService } = require('../dist/src/modules/sync/sync-engine.service');

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
    const normalizer = app.get(NormalizerService);
    const larkService = app.get(LarkRecordService);
    const tiktokApi = app.get(TiktokApiClient);
    const prisma = app.get(PrismaService);
    const syncEngine = app.get(SyncEngineService);
    
    const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) throw new Error("No shop found");
    
    const orderIds = ['584738947229582374'];
    
    for (const orderId of orderIds) {
        console.log('--- Processing:', orderId, '---');
        
        console.log('Fetching return...');
        // We will fetch returns but we need to find the specific orderId
        // TikTok /returns/search doesn't support order_id directly, or maybe it supports order_id? 
        // We can just fetch the order directly first, and if its status is RETURN/COMPLETED, we try to get returns?
        // Actually, just fetch the order first!
        const orderRes = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, orderId);
        let rawOrder = null;
        if (orderRes && orderRes.orders && orderRes.orders.length > 0) {
           rawOrder = orderRes.orders[0];
        }
        
        let payload;
        let syncKey = '';
        
        // Since we want to test mapping of THIS exact order, let's see if we can find its return:
        const returnsRes = await tiktokApi.callApi(
          'POST',
          '/return_refund/202309/returns/search',
          shop.shopId,
          { shop_cipher: shop.shopCipher, page_size: 50 },
          shop.platform
        );
        const returnsList = returnsRes.returns || returnsRes.return_refunds || returnsRes.return_orders || [];
        const rawReturn = returnsList.find(r => r.order_id === orderId);
        
        if (rawReturn) {
           console.log('Found return data for', orderId);
           syncKey = 'return_' + rawReturn.return_id;
           payload = normalizer.normalizeReturn(rawReturn, shop.shopId, shop.brand);
        } else if (rawOrder) {
           console.log('Not found in recent returns, using order data instead for', orderId);
           syncKey = 'order_' + rawOrder.id;
           payload = normalizer.normalizeOrder(rawOrder, shop.shopId, shop.brand);
        } else {
           console.log('Not found in orders either.');
           continue;
        }
        
        // Strip raw fields
        const finalFields = syncEngine.stripRawFields(payload.larkFields);
        console.log('--- finalFields ---');
        console.log(JSON.stringify(finalFields, null, 2));
        
        console.log('Syncing to Lark with SyncKey:', syncKey);
        const upsertRes = await larkService.upsertRecord({
           syncKey,
           fields: finalFields
        });
        console.log('Upsert result:', upsertRes);
    }
    
    await app.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
bootstrap();
