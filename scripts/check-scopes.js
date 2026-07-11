const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';

  try {
    // 1. Get tenant_access_token
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    const token = authRes.data.tenant_access_token;

    // 2. Try to get token info
    const infoRes = await axios.get('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      // Actually there's no token info endpoint that easily lists scopes,
      // but we can just use another endpoint to see.
      headers: { Authorization: `Bearer ${token}` }
    });
    
  } catch (error) {
    console.error('Request failed:', error.response?.data || error.message);
  }
}
main();
