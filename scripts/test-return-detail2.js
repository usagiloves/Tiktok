require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const shopId = 'Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q';
  const token = await prisma.tiktokToken.findUnique({ where: { shopId } });
  const shop = await prisma.shop.findUnique({ where: { platform_shopId: { platform: 'TIKTOK', shopId } } });
  
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const path = '/return_refund/202309/returns/search';
  const queries = {
    app_key: appKey,
    timestamp,
    shop_cipher: shop.shopCipher
  };
  
  const keys = Object.keys(queries).sort();
  let signString = appSecret + path;
  for (const key of keys) {
    signString += key + queries[key];
  }
  signString += appSecret;
  const sign = crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
  
  const url = `https://open-api.tiktokglobalshop.com${path}?app_key=${appKey}&timestamp=${timestamp}&shop_cipher=${shop.shopCipher}&sign=${sign}&access_token=${token.accessToken}`;
  
  const body = {
    order_id: '584886615628940289'
  };
  
  try {
    const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
  await prisma.$disconnect();
}
test();
