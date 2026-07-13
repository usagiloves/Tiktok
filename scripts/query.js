const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`docker exec -i tiktok_lark_api sh -c "wget --post-data='{\\"from\\": \\"2026-06-01T00:00:00Z\\"}' --header='Content-Type: application/json' -qO- http://localhost:3000/admin/reconcile/historical"`, (err, stream) => { 
    stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', () => conn.end()); 
  }); 
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
