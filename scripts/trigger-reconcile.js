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
    const axios = require('axios');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function run() {
      try {
        const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
        if (!shop) throw new Error("No shop");
        
        const now = new Date();
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
        const to = now.toISOString();
        
        const res = await axios.post('http://localhost:3000/admin/reconcile/returns', {
          shop_id: shop.shopId,
          from: from,
          to: to
        });
        console.log("Triggered Reconcile Returns:", JSON.stringify(res.data, null, 2));
      } catch(e) {
         console.error(e.message);
      } finally {
         await prisma['$disconnect']();
      }
    }
    run();
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
