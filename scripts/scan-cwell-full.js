const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    const { ReconcileService } = require('./dist/src/modules/reconcile/reconcile.service');
    const { getQueueToken } = require('@nestjs/bullmq');
    const { QUEUE_NAMES, JOB_NAMES } = require('./dist/src/common/constants');
    
    async function run() {
      console.log('Bootstrapping application...');
      const app = await NestFactory.createApplicationContext(AppModule);
      const prisma = app.get(PrismaService);
      const reconcileService = app.get(ReconcileService);
      const syncQueue = app.get(getQueueToken(QUEUE_NAMES.SYNC_ORDER));
      
      const shops = await prisma.shop.findMany({ where: { platform: 'TIKTOK', isActive: true } });
      const cwell = shops.find(s => s.shopName.toUpperCase().includes('CWELL'));
      
      if (!cwell) {
         console.error('CWELL shop not found!');
         await app.close();
         process.exit(1);
      }
      
      // June 20, 2026 00:00:00 GMT+7
      const fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00+07:00').getTime() / 1000);
      const toTimestamp = Math.floor(Date.now() / 1000);
      
      console.log(\`Scanning CWELL (ShopID: \${cwell.shopId}) from \${fromTimestamp} to \${toTimestamp}\`);
      
      console.log('1. Sweeping orders...');
      const oStats = await reconcileService.reconcileOrders(cwell.shopId, fromTimestamp, toTimestamp);
      console.log('Order Stats:', oStats);
      
      console.log('2. Sweeping returns...');
      const rStats = await reconcileService.reconcileReturns(cwell.shopId, fromTimestamp, toTimestamp);
      console.log('Return Stats:', rStats);
      
      console.log('Wait 15 seconds for worker to save NormalizedRequests...');
      await new Promise(r => setTimeout(r, 15000));
      
      console.log('3. Force Pushing CWELL Failed Deliveries to Cần kiểm tra...');
      const cwellOrders = await prisma.normalizedRequest.findMany({
        where: { platform: 'TIKTOK', shopId: cwell.shopId, internalStatus: 'Đang hoàn' },
        select: { orderId: true, payload: true, shopId: true }
      });
      
      let cwellFailedDeliveries = [];
      for (const o of cwellOrders) {
        if (o.payload) {
          const note = String(o.payload._raw_system_note || '').toUpperCase();
          if (
            note.includes('LOGISTICS') || 
            note.includes('DELIVERY') || 
            note.includes('THẤT BẠI') || 
            note.includes('GIAO GÓI HÀNG')
          ) {
            cwellFailedDeliveries.push({ orderId: o.orderId, shopId: o.shopId });
          }
        }
      }
      
      console.log(\`Found \${cwellFailedDeliveries.length} CWELL failed deliveries. Pushing them all...\`);
      
      const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
      const tiktokApi = app.get(TiktokApiClient);
      
      let pushed = 0;
      for (const item of cwellFailedDeliveries) {
        try {
          const res = await tiktokApi.getOrderDetail(cwell.shopId, cwell.shopCipher, item.orderId);
          const orders = res.orders || res.order_list || [res];
          const order = orders[0];
          
          if (!order) continue;
          
          const updateTimeMs = order.update_time ? Number(order.update_time) * 1000 : Date.now();
          
          await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
            orderId: item.orderId,
            shopId: cwell.shopId,
            source: 'RETROACTIVE_PUSH',
            isFailedDelivery: true,
            isHardCut: true,
            warehouseReceivedAtMs: updateTimeMs
          });
          pushed++;
        } catch (e) {
           if (e.message && e.message.includes('not exist')) {
             await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
                orderId: item.orderId,
                shopId: cwell.shopId,
                source: 'RETROACTIVE_PUSH',
                isFailedDelivery: true,
                isHardCut: true, 
                warehouseReceivedAtMs: Date.now()
              });
              pushed++;
           }
        }
      }
      console.log(\`Force pushed \${pushed} failed deliveries.\`);
      
      await app.close();
      process.exit(0);
    }
    
    run().catch(console.error);
  `;
  
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /app/trigger.js && cd /app && node /app/trigger.js"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.write(script);
    stream.end();
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      console.log('\nVPS execution finished.');
      conn.end();
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
