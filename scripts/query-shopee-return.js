const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { PrismaService } = require('./dist/src/common/prisma/prisma.service.js');
const axios = require('axios');
const crypto = require('crypto');

const partnerId = '2036656';
const partnerKey = '<SHOPEE_PARTNER_KEY>';

async function main() {
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const shopId = '986665118';
  const tokenRecord = await prisma.shopeeToken.findUnique({
    where: { shopId }
  });

  if (!tokenRecord) {
    console.log('No token found for shop', shopId);
    await app.close();
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
    console.log('Fetching returns list...');
    const res = await axios.default.get(url);
    console.log('Returns List API Response:', JSON.stringify(res.data, null, 2));

    if (res.data.response && res.data.response.return && res.data.response.return.length > 0) {
      const returnSn = res.data.response.return[0].return_sn;
      console.log('\nFetching detail for:', returnSn);
      
      const detailPath = '/api/v2/returns/get_return_detail';
      const detailBaseStr = partnerId + detailPath + timestamp + accessToken + shopId;
      const detailSign = crypto.createHmac('sha256', partnerKey).update(detailBaseStr).digest('hex');
      const detailUrl = `https://partner.shopeemobile.com${detailPath}?partner_id=${partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${detailSign}&return_sn=${returnSn}`;
      
      const detailRes = await axios.default.get(detailUrl);
      console.log('Return Detail API Response:', JSON.stringify(detailRes.data, null, 2));
    } else {
      console.log('No returns found.');
    }
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }

  await app.close();
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});
