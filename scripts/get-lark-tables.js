const axios = require('axios');

async function main() {
  const appId = '<LARK_APP_ID_2>';
  const appSecret = '<LARK_APP_SECRET_2>';
  const appToken = 'K8USwySgkiqXIGkLm3KjuLWPpuf'; // Wiki token

  try {
    // 1. Get tenant_access_token
    const authRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });

    if (authRes.data.code !== 0) {
      console.error('Auth Error:', authRes.data);
      return;
    }

    const token = authRes.data.tenant_access_token;
    console.log('Got Tenant Access Token:', token.substring(0, 10) + '...');

    // 2. Get obj_token from Wiki node
    const wikiRes = await axios.get(`https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token=${appToken}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (wikiRes.data.code !== 0) {
      console.error('Wiki Error:', wikiRes.data);
      return;
    }

    const objToken = wikiRes.data.data.node.obj_token;
    const objType = wikiRes.data.data.node.obj_type;
    console.log('Got Real Base Token:', objToken);
    console.log('Object Type:', objType);

    // If it's docx, we need to list blocks to find the bitable
    if (objType === 'docx') {
      const blocksRes = await axios.get(`https://open.larksuite.com/open-apis/docx/v1/documents/${objToken}/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Docx Blocks:');
      const blocks = blocksRes.data.data.items.filter(b => b.block_type === 18); // 18 is bitable
      console.log(JSON.stringify(blocks, null, 2));
      return;
    }

    // 3. List tables
    const tableRes = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${objToken}/tables`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (tableRes.data.code !== 0) {
      console.error('List Tables Error:', tableRes.data);
      return;
    }

    console.log('Tables:');
    console.log(JSON.stringify(tableRes.data.data.items, null, 2));

  } catch (error) {
    console.error('Request failed:', error.response?.data || error.message);
  }
}

main();
