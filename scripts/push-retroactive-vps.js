const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    const { getQueueToken } = require('@nestjs/bullmq');
    const { QUEUE_NAMES, JOB_NAMES } = require('./dist/src/common/constants');
    
    async function run() {
      console.log('Bootstrapping application...');
      const app = await NestFactory.createApplicationContext(AppModule);
      const tiktokApi = app.get(TiktokApiClient);
      const prisma = app.get(PrismaService);
      const syncQueue = app.get(getQueueToken(QUEUE_NAMES.SYNC_ORDER));
    
      const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
      if (!shop || !shop.shopCipher) {
        console.log('No active TikTok shop found');
        await app.close();
        return;
      }
    
      // From June 20th to Now
      const fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00+07:00').getTime() / 1000);
      const toTimestamp = Math.floor(Date.now() / 1000);
    
      let pageToken = undefined;
      let hasMore = true;
      let count = 0;
      let pushed = 0;
    
      console.log('Fetching TikTok orders from June 20th...');
    
      while (hasMore) {
        try {
          const result = await tiktokApi.getOrderList({
            shopId: shop.shopId,
            shopCipher: shop.shopCipher,
            updateTimeFrom: fromTimestamp,
            updateTimeTo: toTimestamp,
            pageSize: 50,
            pageToken,
          });
    
          const orders = result.orders || [];
          if (orders.length > 0) {
            for (const o of orders) {
              count++;
              const status = String(o.order_status || '').toUpperCase();
              const reason = String(o.cancel_reason || o.cancellation_reason || '').toUpperCase();
              const initiator = String(o.cancellation_initiator || o.cancel_initiator || '').toUpperCase();
    
              if (initiator === 'BUYER' || reason.includes('BUYER')) continue;
              if (initiator === 'SELLER' || reason.includes('SELLER')) continue;
    
              let isFailedDelivery = false;
              if (
                initiator === 'LOGISTICS' || 
                reason.includes('DELIVERY') || 
                reason.includes('FAIL') || 
                reason.includes('THẤT BẠI') || 
                reason.includes('GIAO GÓI HÀNG') ||
                (initiator === 'SYSTEM' && (reason.includes('GIAO') || reason.includes('DELIVERY')))
              ) {
                isFailedDelivery = true;
              }
    
              if (isFailedDelivery && (status === 'COMPLETED' || status === 'CANCELLED')) {
                const warehouseReceivedAtMs = o.update_time 
                    ? Number(o.update_time) * 1000 
                    : Date.now();
                    
                await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
                  orderId: o.order_id,
                  shopId: shop.shopId,
                  source: 'RETROACTIVE_PUSH',
                  isFailedDelivery: true,
                  warehouseReceivedAtMs: status === 'COMPLETED' ? warehouseReceivedAtMs : undefined,
                });
                console.log(\`[Pushed TikTok] Order \${o.order_id} (\${status}) pushed to queue.\`);
                pushed++;
              }
            }
          }
    
          pageToken = result.next_page_token;
          hasMore = !!pageToken && orders.length > 0;
        } catch (e) {
          console.error('API Error:', e.message);
          hasMore = false;
        }
      }
    
      console.log(\`\\nScan complete. Scanned \${count} TikTok orders. Pushed \${pushed} failed-delivery orders.\`);
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
