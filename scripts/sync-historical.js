const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { ReconcileService } = require('./dist/src/modules/reconcile/reconcile.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconcileService = app.get(ReconcileService);
  
  const shopId = '7494498334469794054';
  
  // April 15, 2026 to April 25, 2026 for the specific order
  let current = new Date('2026-04-15T00:00:00Z').getTime() / 1000;
  const end = new Date('2026-04-25T00:00:00Z').getTime() / 1000;
  
  console.log('Running historical sync...');
  await reconcileService.reconcileOrders(shopId, current, end);
  await reconcileService.reconcileReturns(shopId, current, end);
  
  // Also push last 30 days
  const now = Math.floor(Date.now() / 1000);
  const monthAgo = now - 30 * 24 * 60 * 60;
  await reconcileService.reconcileOrders(shopId, monthAgo, now);
  await reconcileService.reconcileReturns(shopId, monthAgo, now);
  
  console.log('Done!');
  process.exit(0);
}
bootstrap();
    `;
    const nodeCmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/hist_sync.js <<'EOF'\n${script}\nEOF\nnode /tmp/hist_sync.js"`;
    
    conn.exec(nodeCmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d); })
              .on('close', () => {
                  conn.end();
              });
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
