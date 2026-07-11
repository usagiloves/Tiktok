const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    
    async function run() {
      const app = await NestFactory.createApplicationContext(AppModule);
      const prisma = app.get(PrismaService);
      
      const cwellOrders = await prisma.normalizedRequest.findMany({
         where: { platform: 'TIKTOK', shopId: 'KhOTlgAAAAC7LjvzzxvKXhqKg0_mavCCb0BnQ6OXOaYDKDLsHULc9w' }
      });
      
      let failedDeliveries = [];
      for (const o of cwellOrders) {
        if (o.payload) {
          const note = String(o.payload._raw_system_note || '').toUpperCase();
          if (
            note.includes('LOGISTICS') || 
            note.includes('DELIVERY') || 
            note.includes('THẤT BẠI') || 
            note.includes('GIAO GÓI HÀNG')
          ) {
            failedDeliveries.push(o.internalStatus);
          }
        }
      }
      
      const counts = failedDeliveries.reduce((acc, status) => {
         acc[status] = (acc[status] || 0) + 1;
         return acc;
      }, {});
      
      console.log('CWELL Failed Deliveries Statuses:', counts);
      
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
