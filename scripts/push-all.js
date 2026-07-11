const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { ReconcileService } = require('./dist/src/modules/reconcile/reconcile.service');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function bootstrap() {
  let out = "";
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const reconcileService = app.get(ReconcileService);
    
    const shopId = '7494498334469794054';
    
    out += 'Running historical sync...\\n';
    
    const chunks = [
      { start: '2026-06-20T00:00:00Z', end: '2026-06-30T00:00:00Z' },
      { start: '2026-06-30T00:00:00Z', end: '2026-07-09T23:59:59Z' }
    ];

    for (const c of chunks) {
      const startTs = Math.floor(new Date(c.start).getTime() / 1000);
      const endTs = Math.floor(new Date(c.end).getTime() / 1000);
      out += \`Sweeping \${c.start} to \${c.end}...\\n\`;
      const s1 = await reconcileService.reconcileOrders(shopId, startTs, endTs);
      out += 'Orders: ' + JSON.stringify(s1) + '\\n';
      const s2 = await reconcileService.reconcileReturns(shopId, startTs, endTs);
      out += 'Returns: ' + JSON.stringify(s2) + '\\n';
    }
    
    out += 'Done sweeping!\\n';
  } catch(e) {
    out += 'ERROR: ' + e.message + '\\n';
  }
  fs.writeFileSync('/tmp/sweep.log', out);
  process.exit(0);
}
bootstrap();
    `;
    const nodeCmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/hist_sync.js <<'EOF'\n${script}\nEOF\nnode /tmp/hist_sync.js && cat /tmp/sweep.log"`;
    
    conn.exec(nodeCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString())).on('close', () => { setTimeout(()=>conn.end(), 1000) });
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
