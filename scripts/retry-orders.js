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
    const orders = ['584906968398922962', '584878715104692203', '584852942476444884', '584836838545786734'];
    console.log("Finding sync keys for orders:", orders);
    
    const records = await prisma.normalizedRequest.findMany({
       where: { orderId: { in: orders } }
    });
    console.log("Found " + records.length + " records.");
    
    for (const record of records) {
       console.log("Retrying sync for:", record.syncKey);
       try {
           const res = await axios.post('http://localhost:3000/admin/sync/retry', { sync_key: record.syncKey });
           console.log("Result:", res.data);
       } catch(e) {
           console.error("Error for " + record.syncKey, e.message);
       }
    }
  } catch(e) {
     console.error(e.message);
  } finally {
     process.exit(0);
  }
}
run();`;
  
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/retry.js <<'EOF'
${scriptContent}
EOF
node /tmp/retry.js"`;
  
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
