const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = '<LARK_BASE_TOKEN_2>'; 
  const tableId = 'tblOeO9RTCQdAnqg';

  try {
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    const token = authRes.data.tenant_access_token;

    // Test creating record with multiple fields
    const createRes = await axios.post(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        fields: {
          "Ngày về kho": "2026/04/22 12:55",
          "Kênh bán": "Shopee",
          "Thương hiệu": ["CWELL"], 
          "Mã đơn gốc": "TEST_ONLY_VALID",
          "sync_key": "TEST_SYNC_KEY"
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
