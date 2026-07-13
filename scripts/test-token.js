require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

async function testToken(token, appKey, appSecret) {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/authorization/202309/shops';
    const signString = appSecret + path + 'app_key' + appKey + 'timestamp' + timestamp + appSecret;
    const sign = crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
    
    const url = 'https://open-api.tiktokglobalshop.com' + path + '?app_key=' + appKey + '&timestamp=' + timestamp + '&sign=' + sign;
    const res = await axios.get(url, { headers: { 'x-tts-access-token': token } });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

testToken(process.argv[2], process.env.TIKTOK_APP_KEY, process.env.TIKTOK_APP_SECRET);
