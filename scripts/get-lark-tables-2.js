const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = 'GjZkbn6EEavyqisf1VgjMTEjpmc'; // Real Base Token

  try {
    // 1. Get tenant_access_token
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    if (authRes.data.code !== 0) {
      console.error('Auth Error:', authRes.data);
      return;
    }

    const token = authRes.data.tenant_access_token;
    console.log('Got Tenant Access Token:', token.substring(0, 10) + '...');

    // 2. List tables
    const tableRes = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (tableRes.data.code !== 0) {
      console.error('List Tables Error:', tableRes.data);
      return;
    }

    console.log('Tables:');
    console.log(JSON.stringify(tableRes.data.data.items, null, 2));

  } catch (error) {
    console.error('Request failed:', error.response?.data || error.message);
  }
}

main();
