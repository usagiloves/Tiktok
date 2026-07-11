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
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function run() {
  try {
    console.log("Wiping database caches (LarkRecord, NormalizedRequest, SyncLog)...");
    await prisma.larkRecord.deleteMany({});
    await prisma.normalizedRequest.deleteMany({});
    await prisma.syncLog.deleteMany({});
    console.log("Database wiped successfully!");
    
    const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (shop) {
        console.log("Triggering sync for recent 14 days...");
        const now = new Date();
        const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const to = now.toISOString();
        
        const resOrders = await axios.post('http://localhost:3000/admin/reconcile/orders', { shop_id: shop.shopId, from, to });
        console.log("Orders:", resOrders.data.stats);
        
        const resReturns = await axios.post('http://localhost:3000/admin/reconcile/returns', { shop_id: shop.shopId, from, to });
        console.log("Returns:", resReturns.data.stats);
    }
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    process.exit(0);
  }
}
run();
`;

conn.on('ready', async () => {
  const b64 = Buffer.from(innerScript).toString('base64');
  const cmd = `docker exec -i tiktok_lark_api sh -c "echo '${b64}' | base64 -d > /app/wipe.js && cd /app && node wipe.js"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
