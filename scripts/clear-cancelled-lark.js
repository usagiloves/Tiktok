const axios = require('axios');
const LARK_APP_ID = "<LARK_APP_ID>";
const LARK_APP_SECRET = "<LARK_APP_SECRET>";
const BASE_TOKEN = "D77GwIjOFirA6ik0XAWjFe7LpGd";
const TABLE_ID = "tblcumPr02Uf7xGK";

async function clearCancelled() {
  try {
    console.log('Authenticating with Lark...');
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: LARK_APP_ID,
      app_secret: LARK_APP_SECRET
    });
    const token = authRes.data.tenant_access_token;
    const headers = { Authorization: 'Bearer ' + token };

    let hasMore = true;
    let pageToken = '';
    let totalDeleted = 0;

    console.log('Fetching and deleting Đơn huỷ records...');
    while (hasMore) {
      // Query records where Loại yêu cầu = 'Đơn huỷ'
      const listRes = await axios.post(
        `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records/search`,
        {
          filter: {
            conjunction: "and",
            conditions: [
              {
                field_name: "Loại yêu cầu",
                operator: "is",
                value: ["Đơn huỷ"]
              }
            ]
          }
        },
        { headers }
      );
      
      const records = listRes.data.data.items || [];
      if (records.length === 0) break;

      const recordIds = records.map(r => r.record_id);
      
      await axios.post(
        `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records/batch_delete`,
        { records: recordIds },
        { headers }
      );
      
      totalDeleted += recordIds.length;
      console.log(`Deleted ${totalDeleted} records...`);

      hasMore = listRes.data.data.has_more;
      pageToken = listRes.data.data.page_token;
    }

    console.log('Successfully cleared all Đơn huỷ records from Lark Base!');
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

clearCancelled();
