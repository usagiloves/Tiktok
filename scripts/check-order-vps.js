const axios = require('axios');
const crypto = require('crypto');
const { Client } = require('pg');
require('dotenv').config();

const APP_KEY = process.env.TIKTOK_APP_KEY;
const APP_SECRET = process.env.TIKTOK_APP_SECRET;

function generateSign(url, params, appSecret) {
  const paramKeys = Object.keys(params).filter(k => k !== 'sign' && k !== 'access_token').sort();
  let signString = appSecret + url;
  for (const key of paramKeys) {
    signString += key + params[key];
  }
  signString += appSecret;
  return crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
}

async function checkOrder() {
  const client = new Client({
    connectionString: "postgresql://admin:admin123@localhost:5432/tiktok_lark_sync?schema=public"
  });
  await client.connect();
  const resDb = await client.query("SELECT * FROM shops WHERE platform='TIKTOK' AND is_active=true LIMIT 1;");
  await client.end();
  
  if (resDb.rows.length === 0) {
    console.log("No shop found");
    return;
  }
  
  const shop = resDb.rows[0];
  const orderId = '584789657879021511';
  
  const path = '/api/orders/detail/query';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const queryParams = {
    app_key: APP_KEY,
    timestamp,
    shop_cipher: shop.shop_cipher,
    shop_id: shop.shop_id,
  };

  queryParams.sign = generateSign(path, queryParams, APP_SECRET);
  
  const url = `https://open-api.tiktokglobalshop.com${path}?${new URLSearchParams(queryParams).toString()}`;
  
  try {
    const res = await axios.post(url, {
      order_id_list: [orderId]
    }, {
      headers: {
        'x-tts-access-token': shop.access_token,
        'Content-Type': 'application/json'
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkOrder().catch(console.error);
