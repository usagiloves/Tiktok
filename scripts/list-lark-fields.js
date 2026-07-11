const axios = require('axios');
async function run() {
  const LARK_APP_ID = "<LARK_APP_ID_2>";
  const LARK_APP_SECRET = "<LARK_APP_SECRET_2>";
  const BASE_TOKEN = "<LARK_BASE_TOKEN_2>";
  const TABLE_ID = "tblOeO9RTCQdAnqg";
  const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: LARK_APP_ID,
    app_secret: LARK_APP_SECRET
  });
  const token = authRes.data.tenant_access_token;
  const res = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/fields`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log(res.data.data.items.map(i => ({ name: i.field_name, type: i.type })));
}
run().catch(console.error);
