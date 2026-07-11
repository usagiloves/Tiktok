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
    const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
    if (!shop) throw new Error("No shop");
    
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const to = now.toISOString();
    
    console.log("Triggering Reconcile Orders for the last 24 hours...");
    const resOrders = await axios.post('http://localhost:3000/admin/reconcile/orders', { shop_id: shop.shopId, from, to });
    console.log("Orders Reconciled:", resOrders.data.stats);
  } catch(e) {
     console.error(e.message);
  } finally {
     process.exit(0);
  }
}
run();`;
  
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/trigger.js <<'EOF'
${scriptContent}
EOF
node /tmp/trigger.js"`;
  
  try {
    const raw = await runCommand(conn, cmd);
    console.log(raw);
  } catch (err) {
    console.error(err);
  }
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
