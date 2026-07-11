const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
    const { getQueueToken } = require('@nestjs/bullmq');
    const { QUEUE_NAMES, JOB_NAMES } = require('./dist/src/common/constants');
    
    async function run() {
      console.log('Bootstrapping application...');
      const app = await NestFactory.createApplicationContext(AppModule);
      const prisma = app.get(PrismaService);
      const tiktokApi = app.get(TiktokApiClient);
      const syncQueue = app.get(getQueueToken(QUEUE_NAMES.SYNC_ORDER));
    
      const shops = await prisma.shop.findMany({ where: { platform: 'TIKTOK', isActive: true } });
      const shopMap = new Map();
      shops.forEach(s => shopMap.set(s.shopId, s));
      
      const cwellShopId = shops.find(s => s.shopName.includes('CWELL'))?.shopId;
      
      const cwellOrders = await prisma.normalizedRequest.findMany({
        where: { platform: 'TIKTOK', shopId: cwellShopId, internalStatus: 'Đang hoàn' },
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
      
      let pushed = 0;
      for (const item of cwellFailedDeliveries) {
        const orderId = item.orderId;
        const shop = shopMap.get(item.shopId);
        
        if (!shop || !shop.shopCipher) {
          continue;
        }
        
        try {
          const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, orderId);
          const orders = res.orders || res.order_list || [res];
          const order = orders[0];
          
          if (!order) continue;
          
          const updateTimeMs = order.update_time ? Number(order.update_time) * 1000 : Date.now();
          
          await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
            orderId: orderId,
            shopId: shop.shopId,
            source: 'RETROACTIVE_PUSH',
            isFailedDelivery: true,
            isHardCut: true, // Bypass anti-spam
            warehouseReceivedAtMs: updateTimeMs
          });
          console.log(\`[Pushed] \${orderId} pushed as Cần kiểm tra with warehouseReceivedAt = update_time.\`);
          pushed++;
        } catch (e) {
           if (e.message && e.message.includes('not exist')) {
             console.log(\`[Hard Cut] \${orderId} not found. Pushing as Cần kiểm tra.\`);
             await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
                orderId: orderId,
                shopId: shop.shopId,
                source: 'RETROACTIVE_PUSH',
                isFailedDelivery: true,
                isHardCut: true, 
                warehouseReceivedAtMs: Date.now()
              });
              pushed++;
           } else {
             console.error(\`Error fetching \${orderId}:\`, e.message);
           }
        }
      }
      
      console.log(\`\\nAll done! Pushed \${pushed} orders to Lark.\`);
      await app.close();
      process.exit(0);
    }
    
    run().catch(err => {
      console.error(err);
      process.exit(1);
    });
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
