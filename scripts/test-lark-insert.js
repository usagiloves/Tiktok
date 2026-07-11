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

  const payload = {
    "Kênh bán": "Tiktok",
    "Thương hiệu": ["GOODFIT"],
    "Ngày tạo đơn": "2026/07/08 00:00",
    "Mã đơn gốc": "test_order",
    "sync_key": "test_sync_key"
  };

  try {
    const res = await axios.post(`https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records`, {
      fields: payload
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
run().catch(console.error);
