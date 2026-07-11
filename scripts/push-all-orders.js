const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const axios = require('axios');
async function run() {
  const shopId = '7494498334469794054';
  let current = new Date('2026-04-01T00:00:00Z').getTime();
  const end = new Date().getTime();
  
  while (current < end) {
    let next = current + 10 * 24 * 60 * 60 * 1000;
    if (next > end) next = end;
    
    const from = new Date(current).toISOString();
    const to = new Date(next).toISOString();
    console.log('Pushing from', from, 'to', to);
    
    try {
      const res = await axios.post('http://localhost:3000/admin/reconcile/orders', { shop_id: shopId, from, to });
      console.log('Result:', res.data.stats);
    } catch(e) {
      console.error(e.message);
    }
    current = next;
  }
}
run();
    `;
    const nodeCmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/push_all2.js <<'EOF'\n${script}\nEOF\nnode /tmp/push_all2.js"`;
    
    conn.exec(nodeCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d))
              .on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
