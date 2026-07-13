const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "SELECT shop_id, shop_name, is_active FROM shops;"`, (err, stream) => { 
    stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', () => conn.end()); 
  }); 
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
