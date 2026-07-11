const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://admin:admin@<VPS_IP>:5432/tiktok_lark_sync?schema=public'
    }
  }
});

const partnerId = '2036656';
const partnerKey = '<SHOPEE_PARTNER_KEY>';

async function main() {
  const shopId = '986665118';
  const tokenRecord = await prisma.shopeeToken.findUnique({
    where: { shopId }
  });

  if (!tokenRecord) {
    console.log('No token found for shop', shopId);
    return;
  }

  const accessToken = tokenRecord.accessToken;
  const timestamp = Math.floor(Date.now() / 1000);
  const timeFrom = timestamp - 15 * 24 * 60 * 60;
  const apiPath = '/api/v2/returns/get_return_list';

  const baseStr = partnerId + apiPath + timestamp + accessToken + shopId;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseStr).digest('hex');

  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&time_from=${timeFrom}&time_to=${timestamp}&page_no=0&page_size=10`;

  try {
    const res = await axios.get(url);
    console.log('Returns List API Response:', JSON.stringify(res.data, null, 2));

    if (res.data.response && res.data.response.return && res.data.response.return.length > 0) {
      const returnSn = res.data.response.return[0].return_sn;
      console.log('\nFetching detail for:', returnSn);
      
      const detailPath = '/api/v2/returns/get_return_detail';
      const detailBaseStr = partnerId + detailPath + timestamp + accessToken + shopId;
      const detailSign = crypto.createHmac('sha256', partnerKey).update(detailBaseStr).digest('hex');
      const detailUrl = `https://partner.shopeemobile.com${detailPath}?partner_id=${partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${detailSign}&return_sn=${returnSn}`;
      
      const detailRes = await axios.get(detailUrl);
      console.log('Return Detail API Response:', JSON.stringify(detailRes.data, null, 2));
    } else {
      console.log('No returns found.');
    }
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }
}

main().finally(() => prisma.$disconnect());
