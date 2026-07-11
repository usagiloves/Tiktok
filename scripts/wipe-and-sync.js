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
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/dashboard',
  method: 'GET'
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const shopId = data.shops[0].shopId;
      console.log('Found shopId:', shopId);
      
      const start = new Date('2026-06-25T00:00:00.000Z').getTime();
      const end = new Date().getTime();
      const chunk = 10 * 24 * 60 * 60 * 1000;
      
      for (let t = start; t < end; t += chunk) {
          const from = new Date(t).toISOString();
          const to = new Date(Math.min(t + chunk, end)).toISOString();
          console.log('--- Chunk:', from, 'to', to, '---');
          
          // Bỏ sync đơn huỷ (Orders) theo yêu cầu user - chỉ sync Returns
          console.log('Triggering Reconcile Returns...');
          const resReturns = await fetch('http://localhost:3000/admin/reconcile/returns', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shop_id: shopId, from, to })
          });
          console.log('Returns Reconciled:', await resReturns.json());
      }
    } catch(e) {
      console.error('Error triggering sync:', e.message);
    }
  });
});
req.on('error', e => console.error(e));
req.end();
`;

conn.on('ready', async () => {
  console.log("1. Truncating database tables...");
  const wipeCmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c 'TRUNCATE TABLE "lark_records", "normalized_requests", "sync_logs" CASCADE;'`;
  console.log(await runCommand(conn, wipeCmd));
  
  console.log("2. Executing sync script...");
  const b64 = Buffer.from(innerScript).toString('base64');
  const syncCmd = `docker exec -i tiktok_lark_api sh -c "echo '${b64}' | base64 -d > /tmp/sync.js && cd /app && node /tmp/sync.js"`;
  console.log(await runCommand(conn, syncCmd));
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
