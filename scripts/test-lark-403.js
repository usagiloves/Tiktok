const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = 'GjZkbn6EEavyqisf1VgjMTEjpmc'; 
  const tableId = 'tbluhFGm07f9Vd9o';

  try {
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    const token = authRes.data.tenant_access_token;

    // Test creating record with a field that doesn't exist
    const createRes = await axios.post(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        fields: {
          "sync_key": "test_123"
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('Create result:', JSON.stringify(createRes.data, null, 2));

  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

main();
