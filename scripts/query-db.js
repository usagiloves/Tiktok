const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const conn = new Client();

conn.on('ready', () => {
  const insertQuery = `INSERT INTO shops (shop_id, platform, shop_name, brand, is_active, timezone, shop_cipher, shop_code, created_at, updated_at) VALUES ('KhOTlgAAAAC7LjvzzxvKXhqKg0_mavCCb0BnQ6OXOaYDKDLsHULc9w', 'TIKTOK', 'Cwell', 'CWELL', true, 'Asia/Ho_Chi_Minh', 'none', 'TIKTOK_CWELL', NOW(), NOW());`;
  conn.exec(`docker exec tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "${insertQuery}" && docker exec tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "SELECT * FROM shops;"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
