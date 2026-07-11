const crypto = require('crypto');

const partnerId = '2036656';
const partnerKey = '<SHOPEE_PARTNER_KEY>';
const apiPath = '/api/v2/shop/auth_partner';
const timestamp = Math.floor(Date.now() / 1000);
const baseStr = partnerId + apiPath + timestamp;
const sign = crypto.createHmac('sha256', partnerKey).update(baseStr).digest('hex');
const redirectUri = 'https://sunbox2.duckdns.org/shopee/oauth/callback';
const authUrl = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUri)}`;

console.log(authUrl);
