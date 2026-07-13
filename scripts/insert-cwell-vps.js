const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Inserting CWELL shop...');
  
  const query = `INSERT INTO shops (platform, shop_id, shop_name, brand, is_active, timezone, created_at, updated_at) VALUES ('TIKTOK', 'VNLCLBWL3X', 'CWELL TikTok Shop', 'CWELL', true, 'Asia/Ho_Chi_Minh', now(), now()) ON CONFLICT (platform, shop_id) DO UPDATE SET brand='CWELL', is_active=true;`;
  
  const script = `docker exec tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "${query}"`;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
