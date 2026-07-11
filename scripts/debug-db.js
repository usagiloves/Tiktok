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

const innerScript = `
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
    
    console.log("=== Fetching order 584604550455002916 ===");
    const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher, '584604550455002916');
    
    console.log(JSON.stringify(res, null, 2));
    
    await app.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
bootstrap();
`;

conn.on('ready', async () => {
  const b64 = Buffer.from(innerScript).toString('base64');
  const cmd = `docker exec -i tiktok_lark_api sh -c "echo '${b64}' | base64 -d > /app/debug-db.js && cd /app && node /app/debug-db.js"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
