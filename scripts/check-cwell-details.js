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
      
      const cwell = await prisma.shop.findFirst({
         where: { platform: 'TIKTOK', shopName: { contains: 'CWELL', mode: 'insensitive' } }
      });
      console.log('CWELL Shop:', cwell);
      
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
