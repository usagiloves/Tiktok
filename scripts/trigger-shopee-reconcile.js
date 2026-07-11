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
    
    async function run() {
      try {
        const from = '2026-06-20T00:00:00Z';
        
        console.log("Triggering Historical Sweep...");
        const res = await axios.post('http://localhost:3000/admin/reconcile/historical', {
          from: from
        });
        console.log("Historical Sweep:", JSON.stringify(res.data, null, 2));

      } catch(e) {
         console.error(e.message);
      }
    }
    run();
  `;
  
  const cmd = `docker exec -i tiktok_lark_api node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  console.log("Triggering script on VPS...");
  const raw = await runCommand(conn, cmd);
  console.log(raw);
  
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
