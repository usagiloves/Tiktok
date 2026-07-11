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
      
      const shops = await prisma.shop.findMany({
         where: { platform: 'TIKTOK' }
      });
      console.log('TikTok Shops:', shops.map(s => ({ shopId: s.shopId, name: s.shopName, isActive: s.isActive })));
      
      const countCwell = await prisma.normalizedRequest.count({
         where: { platform: 'TIKTOK', shopId: shops.find(s => s.shopName.includes('CWELL'))?.shopId }
      });
      console.log('Total CWELL orders in DB:', countCwell);
      
      const cwellCanceled = await prisma.normalizedRequest.count({
         where: { platform: 'TIKTOK', shopId: shops.find(s => s.shopName.includes('CWELL'))?.shopId, internalStatus: 'Đã hủy' }
      });
      console.log('Total CWELL canceled orders in DB:', cwellCanceled);
      
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
