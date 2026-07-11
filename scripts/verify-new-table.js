const axios = require('axios');

const APP_ID = '<LARK_APP_ID>';
const APP_SECRET = '<LARK_APP_SECRET>';
const APP_TOKEN = 'D77GwIjOFirA6ik0XAWjFe7LpGd'; // Wiki token
const TABLE_ID = 'tblcumPr02Uf7xGK';

async function main() {
  try {
    console.log('1. Lấy tenant_access_token...');
    const tokenRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: APP_ID,
      app_secret: APP_SECRET,
    });
    
    if (tokenRes.data.code !== 0) {
      throw new Error(`Auth failed: ${JSON.stringify(tokenRes.data)}`);
    }
    const token = tokenRes.data.tenant_access_token;
    console.log('OK Token:', token.substring(0, 10) + '...');

    let realAppToken = APP_TOKEN;
    
    // Thu lấy real base token từ wiki token
    console.log('2. Kiểm tra Wiki Node...');
    try {
      const wikiRes = await axios.get(`https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token=${APP_TOKEN}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (wikiRes.data.code === 0 && wikiRes.data.data.node.obj_token) {
        realAppToken = wikiRes.data.data.node.obj_token;
        console.log('Chuyển đổi Wiki Token sang Base Token thành công:', realAppToken);
      }
    } catch (e) {
      console.log('Không phải wiki node hoặc không có quyền đọc wiki node, thử dùng token gốc...');
    }

    console.log('3. Lấy danh sách cột của Bảng', TABLE_ID);
    const fieldsRes = await axios.get(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${realAppToken}/tables/${TABLE_ID}/fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (fieldsRes.data.code !== 0) {
      throw new Error(`Get fields failed: ${JSON.stringify(fieldsRes.data)}`);
    }

    const fields = fieldsRes.data.data.items;
    console.log('\n--- CẤU TRÚC BẢNG ---');
    fields.forEach(f => {
      console.log(`- ${f.field_name} (Type: ${f.type}, ID: ${f.field_id})`);
    });

  } catch (error) {
    console.error('LỖI:', error.response ? error.response.data : error.message);
  }
}

main();
