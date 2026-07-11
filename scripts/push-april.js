const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const shopId = '7494498334469794054';
    const script = `
const axios = require('axios');
async function run() {
  const shopId = '${shopId}';
  const from = new Date('2026-04-20T00:00:00Z').toISOString();
  const to = new Date('2026-04-25T00:00:00Z').toISOString();
  console.log('Pushing from', from, 'to', to);
  try {
    const res = await axios.post('http://localhost:3000/admin/reconcile/orders', { shop_id: shopId, from, to });
    console.log('Result:', res.data.stats);
  } catch(e) {
    console.error(e.message);
  }
}
run();
    `;
    const nodeCmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/push_one.js <<'EOF'\n${script}\nEOF\nnode /tmp/push_one.js"`;
    
    conn.exec(nodeCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d))
              .on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
