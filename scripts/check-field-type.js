const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = 'H3rSbsE1kaN14asF376ljB30gyh';
  const tableId = 'tbllw5H8o6Q12sJv';

  try {
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });
    const token = authRes.data.tenant_access_token;

    const fieldsRes = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const fields = fieldsRes.data.data.items;
    const targetField = fields.find(f => f.field_name === 'Trạng thái/TH - HT');
    console.log(JSON.stringify(targetField, null, 2));

  } catch (error) {
    console.error('Request failed:', error.response?.data || error.message);
  }
}

main();
