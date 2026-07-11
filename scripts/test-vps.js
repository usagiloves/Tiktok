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
  console.log('--- Triggering Historical Reconcile ---');
  
  const from = new Date("2026-06-20T00:00:00Z").toISOString();
  
  const payload = JSON.stringify({
    from
  });

  const cmd = `curl -s -X POST http://localhost:3000/admin/reconcile/historical -H "Content-Type: application/json" -d '${payload}'`;
  
  await runCommand(conn, cmd);
  
  console.log('\n--- Done ---');
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
