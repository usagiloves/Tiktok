const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const query = `INSERT INTO shops (shop_id, platform, shop_name, brand, is_active, timezone, shop_cipher, shop_code, created_at, updated_at) VALUES ('986665118', 'SHOPEE', 'Shopee Goodfit', 'GOODFIT', true, 'Asia/Ho_Chi_Minh', 'none', 'SHOPEE_GF', NOW(), NOW());`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker exec tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "${query}"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
