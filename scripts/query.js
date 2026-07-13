const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "BEGIN; UPDATE tiktok_tokens SET shop_id = 'VNLC6WWLQL' WHERE shop_id = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q'; UPDATE shops SET shop_id = 'VNLC6WWLQL', shop_code = 'GOODFIT' WHERE shop_id = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q'; COMMIT;"`, (err, stream) => { 
    stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', () => conn.end()); 
  }); 
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
