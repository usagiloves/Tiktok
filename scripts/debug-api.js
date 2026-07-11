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
    
    console.log("=== CALLING getReturnList ===");
    let pageToken = undefined;
    let target = null;
    let pageCount = 0;
    
    while (pageCount < 50) {
        pageCount++;
        const returnsRes = await tiktokApi.getReturnList({
          shopId: shop.shopId,
          shopCipher: shop.shopCipher,
          pageSize: 50,
          pageToken: pageToken
        });
        
        const returnsList = returnsRes.returns || returnsRes.return_refunds || returnsRes.return_orders || [];
        target = returnsList.find(r => r.return_status === 'WAREHOUSE_RECEIVED' || r.status === 'WAREHOUSE_RECEIVED');
        
        if (target || !returnsRes.next_page_token) {
            break;
        }
        pageToken = returnsRes.next_page_token;
    }
    
    if (target) {
        console.log("FOUND WAREHOUSE_RECEIVED RETURN:");
        console.log(JSON.stringify(target, null, 2));
    } else {
        console.log("NOT FOUND WAREHOUSE_RECEIVED IN 50 PAGES.");
    }
    
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
  const cmd = `docker exec -i tiktok_lark_api sh -c "echo '${b64}' | base64 -d > /app/debug.js && cd /app && node /app/debug.js"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
