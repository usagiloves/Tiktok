const axios = require('axios');
require('dotenv').config();

async function testLark() {
  try {
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET
    });
    const token = authRes.data.tenant_access_token;
    
    // Check old table search
    const bitableToken = process.env.LARK_BASE_APP_TOKEN;
    const tableId = process.env.LARK_TABLE_ID_CSKH;
    
    const res = await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/${bitableToken}/tables/${tableId}/records/search`, {
        filter: { conjunction: 'and', conditions: [] },
        page_size: 1
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Search success:', res.data.code);
  } catch (e) {
    console.error('Error:', e.response ? e.response.data : e.message);
  }
}

testLark();
