const { Client } = require('ssh2');

const conn = new Client();

async function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    let output = '';
    conn.exec(cmd, (err, stream) => {
      if (err) reject(err);
      stream.on('close', () => resolve(output)).on('data', data => {
        output += data;
        process.stdout.write(data);
      }).stderr.on('data', data => {
        output += data;
        process.stderr.write(data);
      });
    });
  });
}

conn.on('ready', async () => {
  console.log('SSH connected. Triggering Historical Sweep on VPS...');
  const script = `
    const axios = require('axios');
    async function run() {
      try {
        console.log('Sending request to /admin/reconcile/historical...');
        const res = await axios.post('http://localhost:3000/admin/reconcile/historical', {
          from: '2026-06-20T00:00:00Z'
        }, { timeout: 300000 });
        console.log("Historical Sweep Completed:", JSON.stringify(res.data, null, 2));
      } catch(e) {
         console.error('Error:', e.message);
         if (e.response) console.error(e.response.data);
      }
    }
    run();
  `;
  
  const cmd = `docker exec -i tiktok_lark_api node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  await runCommand(conn, cmd);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
