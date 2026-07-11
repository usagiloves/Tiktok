const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
    
    async function run() {
      const app = await NestFactory.createApplicationContext(AppModule);
      const prisma = app.get(PrismaService);
      const tiktokApi = app.get(TiktokApiClient);
      
      const shops = await prisma.shop.findMany({ where: { platform: 'TIKTOK', isActive: true } });
      const shopMap = new Map();
      shops.forEach(s => shopMap.set(s.shopId, s));
      
      const orderIds = [
        '584870810178455534',
        '584852276274693281',
        '584884845020481073',
        '584888366780876490',
        '584904104935196609'
      ];
      
      console.log('--- VERIFYING 5 PENDING ORDERS ---');
      for (const orderId of orderIds) {
        console.log(\`\\n=========================================\`);
        console.log(\`ORDER ID: \${orderId}\`);
        
        // 1. Fetch DB
        const req = await prisma.normalizedRequest.findFirst({
          where: { orderId: orderId, platform: 'TIKTOK' }
        });
        
        if (!req) {
           console.log('Not found in DB!');
           continue;
        }
        
        const shop = shopMap.get(req.shopId);
        
        console.log(\`[Database] Internal Status: \${req.internalStatus}\`);
        console.log(\`[Database] isReturn: \${req.isReturn}\`);
        console.log(\`[Database] Return ID: \${req.returnId || 'N/A'}\`);
        console.log(\`[Database] Warehouse Received At: \${req.warehouseReceivedAt}\`);
        console.log(\`[Database] Lark Payload 'Trạng thái': \${req.payload['Trạng thái/TH - HT']}\`);
        console.log(\`[Database] Lark Payload 'Ngày về kho': \${req.payload['Ngày về kho']}\`);
        
        // 2. Fetch TikTok API (Order)
        try {
           const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, orderId);
           const order = res.orders ? res.orders[0] : res.order_list[0];
           
           console.log(\`[TikTok Order API] Order Status: \${order.order_status}\`);
           console.log(\`[TikTok Order API] Cancel Reason: \${order.cancel_reason}\`);
           console.log(\`[TikTok Order API] Cancel Initiator: \${order.cancellation_initiator}\`);
           
           if (req.isReturn && req.returnId) {
             try {
                // Fetch Return API if it is a return
                const returnRes = await tiktokApi.getReverseOrder(shop.shopId, shop.shopCipher, req.returnId);
                const ret = returnRes.reverse_orders ? returnRes.reverse_orders[0] : returnRes.reverse_order_list[0];
                console.log(\`[TikTok Return API] Return Status: \${ret.return_order_status}\`);
                console.log(\`[TikTok Return API] Return Type: \${ret.return_type}\`);
             } catch (e) {
                console.log(\`[TikTok Return API] Error: \${e.message}\`);
             }
           }
        } catch (e) {
           console.log(\`[TikTok Order API] Error fetching API: \${e.message}\`);
        }
      }
      
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
    stream.on('close', () => conn.end());
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
