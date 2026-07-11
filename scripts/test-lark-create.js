const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = 'GjZkbn6EEavyqisf1VgjMTEjpmc'; 
  const tableId = 'tbluhFGm07f9Vd9o';

  try {
    // 1. Get tenant_access_token
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    const token = authRes.data.tenant_access_token;
    console.log('Got Tenant Access Token:', token.substring(0, 10) + '...');

    // 2. Try to create a record
    const createRes = await axios.post(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        fields: {
          "Mã đơn gốc": "TEST_ORDER_123"
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('Create result:', JSON.stringify(createRes.data, null, 2));

  } catch (error) {
    console.error('Request failed:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
  }
}

main();
