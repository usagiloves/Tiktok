const axios = require('axios');
require('dotenv').config();

async function run() {
  console.log('Fetching tenant access token...');
  try {
    const tokenRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET
    });
    const token = tokenRes.data.tenant_access_token;
    if (!token) throw new Error('No token ' + JSON.stringify(tokenRes.data));

    const mockRecords = [
      {
        fields: {
          'Ngày về kho': '2026/04/22 12:34',
          'Kênh bán': 'Tiktok',
          'Thương hiệu': ['CWELL'],
          'Mã đơn gốc': '584922153625880009',
          'Mã đơn trả': 'SPXVN067799085564',
          'Loại yêu cầu': 'Đơn giao ko thành công',
          'Trạng thái/TH - HT': 'Đã hoàn hàng'
        }
      }
    ];

    console.log('Sending mock record to Lark...');
    const res = await axios.post(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${process.env.LARK_BASE_APP_TOKEN}/tables/${process.env.LARK_TABLE_ID_CSKH}/records/batch_create`,
      { records: mockRecords },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Record inserted successfully:', res.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

run();
