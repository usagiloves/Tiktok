const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const api = new TiktokApiClient({info: console.log, error: console.error, warn: console.warn, debug: console.log}, prisma);

async function run() {
  try {
    const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) throw new Error("No shop");
    const from = new Date('2026-04-15T00:00:00Z').getTime() / 1000;
    const to = new Date('2026-04-25T00:00:00Z').getTime() / 1000;
    
    const result = await api.getOrderList({
       shopId: shop.shopId,
       shopCipher: shop.shopCipher,
       updateTimeFrom: Math.floor(from),
       updateTimeTo: Math.floor(to),
       pageSize: 100
    });
    console.log("Total orders in range:", result.orders?.length || 0);
    const order = result.orders?.find(o => o.order_id === '583494921316304312');
    if (order) {
       console.log("FOUND IT:", order.order_status, order.cancellation_initiator, order.cancel_reason);
    } else {
       console.log("NOT FOUND IN LIST!");
    }
  } catch(e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
run();
    `;
    const nodeCmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/scan4.js <<'EOF'\n${script}\nEOF\nnode /tmp/scan4.js"`;
    
    conn.exec(nodeCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d)).on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
