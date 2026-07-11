const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker logs --since 1h tiktok_lark_api', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d.toString())
          .stderr.on('data', d => out += d.toString());
    stream.on('close', () => {
      const lines = out.split('\n');
      const filtered = lines.filter(l => l.includes('584852276274693281') || l.includes('SyncWorker'));
      console.log(filtered.join('\n'));
      conn.end();
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
