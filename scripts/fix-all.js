const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Executing fixes...');
  
  const cmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "UPDATE shops SET shop_cipher = 'none' WHERE shop_id = 'VNLCLBWL3X';" && docker exec -i tiktok_lark_api node -e "const http = require('http'); http.get('http://localhost:3000/admin/fix-ciphers', (res) => { res.on('data', d => process.stdout.write(d)); res.on('end', () => { console.log('\\nCalling historical sync...'); const req = http.request({hostname:'localhost', port:3000, path:'/admin/reconcile/historical', method:'POST', headers:{'Content-Type':'application/json'}}, r => { r.on('data', d => process.stdout.write(d)); }); req.write('{\\"from\\":\\"2026-06-20T00:00:00Z\\"}'); req.end(); }); });"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
