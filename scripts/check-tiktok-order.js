const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    
    async function run() {
      const app = await NestFactory.createApplicationContext(AppModule);
      const tiktokApi = app.get(TiktokApiClient);
      const prisma = app.get(PrismaService);
      
      const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
      
      // Lấy 1 đơn đã skip lúc nãy
      const orderId = '584379498190636454';
      
      try {
        const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, orderId);
        const order = res.orders ? res.orders[0] : res.order_list[0];
        console.log(JSON.stringify(order, null, 2));
      } catch (e) {
        console.error(e.message);
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
