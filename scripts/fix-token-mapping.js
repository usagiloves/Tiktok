const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Fixing DB mappings...');
  
  const query = `
    UPDATE tiktok_tokens SET shop_id = 'VNLCLBWL3X' WHERE shop_id = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q';
    UPDATE shops SET shop_cipher = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q' WHERE shop_id = 'VNLCLBWL3X';
  `;
  
  const script = `docker exec tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "${query.replace(/\n/g, ' ')}"`;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
