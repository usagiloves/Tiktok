const { Client } = require('ssh2');

const conn = new Client();

async function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    let output = '';
    conn.exec(cmd, (err, stream) => {
      if (err) reject(err);
      stream.on('close', () => resolve(output)).on('data', data => {
        output += data;
      }).stderr.on('data', data => {
        output += data;
      });
    });
  });
}

conn.on('ready', async () => {
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    
    async function bootstrap() {
      try {
        const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
        const tiktokApi = app.get(TiktokApiClient);
        const prisma = app.get(PrismaService);
        
        const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
        const returns = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, '584604550455002916');
        console.log("RETURN_DATA_START");
        console.log(JSON.stringify(returns, null, 2));
        console.log("RETURN_DATA_END");
        await app.close();
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
    bootstrap();
  `;
  
  const cmd = `docker exec -i tiktok_lark_api node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
