const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@<VPS_IP>:5432/tiktok_lark_sync?schema=public',
});
client.connect().then(() => {
  return client.query(`
    INSERT INTO "Shop" (id, platform, "shopId", "shopName", brand, "shopCipher", "isActive", timezone, "createdAt", "updatedAt")
    VALUES ('test-id-1', 'TIKTOK', 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q', 'TikTok Shop', 'Brand', 'cipher', true, 'Asia/Ho_Chi_Minh', NOW(), NOW())
    ON CONFLICT (platform, "shopId") DO UPDATE SET "isActive" = true;
  `);
}).then(() => {
  console.log('Inserted!');
  client.end();
}).catch(console.error);
