const axios = require('axios');

async function run() {
  try {
    const LARK_APP_ID = "<LARK_APP_ID_2>";
    const LARK_APP_SECRET = "<LARK_APP_SECRET_2>";
    const BASE_TOKEN = "GjZkbn6EEavyqisf1VgjMTEjpmc"; // From rewrite-env.mjs LARK_BASE_APP_TOKEN
    const TABLE_ID = "tbluhFGm07f9Vd9o";

    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: LARK_APP_ID,
      app_secret: LARK_APP_SECRET
    });
    const token = authRes.data.tenant_access_token;
    const headers = { Authorization: 'Bearer ' + token };

    // Define fields to create
    const fieldsToCreate = [
      { field_name: 'Ngày về kho', type: 1 },
      { 
        field_name: 'Kênh bán', 
        type: 3, 
        property: { options: [{ name: 'Shopee' }, { name: 'TikTok' }] } 
      },
      { 
        field_name: 'Thương hiệu', 
        type: 4, 
        property: { options: [{ name: 'CWELL' }, { name: 'GOODFIT' }] } 
      },
      { field_name: 'Ngày tạo đơn', type: 1 },
      { field_name: 'Mã đơn gốc', type: 1 },
      { field_name: 'Mã đơn trả', type: 1 },
      { 
        field_name: 'Loại yêu cầu', 
        type: 3, 
        property: { options: [{ name: 'Đơn giao ko thành công' }, { name: 'Đơn hàng' }, { name: 'Đơn hàng hoàn tất' }, { name: 'Hoàn/trả' }] } 
      },
      { field_name: 'Tình trạng xử lý', type: 1 },
      { field_name: 'Khiếu nại', type: 1 },
      { field_name: 'Ghi chú hệ thống', type: 1 },
      { field_name: 'sync_key', type: 1 },
      { field_name: 'platform', type: 1 },
      { field_name: 'shop_id', type: 1 },
      { field_name: 'request_id', type: 1 },
      { field_name: 'last_tiktok_update_time', type: 2 }, // Number
      { field_name: 'last_synced_at', type: 2 }, // Number
      { field_name: 'sync_status', type: 1 },
      { field_name: 'sync_error', type: 1 }
    ];

    for (const field of fieldsToCreate) {
      try {
        await axios.post(
          `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/fields`,
          field,
          { headers }
        );
        console.log(`Created field: ${field.field_name}`);
      } catch (err) {
        if (err.response && err.response.data.code === 1254023) {
          console.log(`Field already exists: ${field.field_name}`);
        } else {
          console.error(`Failed to create ${field.field_name}:`, err.response ? err.response.data : err.message);
        }
      }
    }
    console.log('Done creating fields!');
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
