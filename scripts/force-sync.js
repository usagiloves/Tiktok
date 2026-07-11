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
  const scriptContent = `const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("1. Resetting lastTiktokUpdateTime...");
    const result = await prisma.normalizedRequest.updateMany({
       data: { lastTiktokUpdateTime: new Date('1970-01-01T00:00:00Z') }
    });
    console.log("Reset " + result.count + " records in database.");
    
    const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) throw new Error("No shop");
    
    const now = new Date();
    const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();
    
    console.log("2. Triggering Reconcile Orders...");
    const resOrders = await axios.post('http://localhost:3000/admin/reconcile/orders', { shop_id: shop.shopId, from, to });
    console.log("Orders Reconciled:", resOrders.data.stats);
    
    console.log("3. Triggering Reconcile Returns...");
    const resReturns = await axios.post('http://localhost:3000/admin/reconcile/returns', { shop_id: shop.shopId, from, to });
    console.log("Returns Reconciled:", resReturns.data.stats);
    
    console.log("Force sync completed!");
  } catch(e) {
     console.error(e.message);
  } finally {
     process.exit(0);
  }
}
run();`;
  
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/force.js <<'EOF'
${scriptContent}
EOF
node /tmp/force.js"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
