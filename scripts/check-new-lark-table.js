const axios = require('axios');

async function main() {
  // New App ID and Secret provided by user
  const appId = 'cli_aac7467515b81e18';
  const appSecret = 'hFFJry9Jca6Fz0Ew14LUacrWbSNqkdKi';
  
  // The wiki token and table ID from the link
  const wikiToken = 'Ok1QwKodkibZUAkywMFj0L5Nptc';
  const tableId = 'tblZEdV73mhkjIak';

  try {
    console.log('1. Fetching tenant_access_token...');
    const tokenRes = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret
    });
    
    if (tokenRes.data.code !== 0) {
      console.error('Failed to get token:', tokenRes.data);
      return;
    }
    const accessToken = tokenRes.data.tenant_access_token;
    console.log('Token OK.');

    console.log(`2. Fetching fields for table ${tableId}...`);
    const fieldsRes = await axios.get(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${wikiToken}/tables/${tableId}/fields`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page_size: 100 }
      }
    );

    if (fieldsRes.data.code !== 0) {
      console.error('Failed to fetch fields:', JSON.stringify(fieldsRes.data, null, 2));
      return;
    }

    console.log('\n--- FIELDS ---');
    fieldsRes.data.data.items.forEach(field => {
      let typeName = 'Unknown';
      switch(field.type) {
        case 1: typeName = 'Text'; break;
        case 2: typeName = 'Number'; break;
        case 3: typeName = 'Single Select'; break;
        case 4: typeName = 'Multi Select'; break;
        case 5: typeName = 'DateTime'; break;
        case 11: typeName = 'User'; break;
        case 15: typeName = 'Link'; break;
        case 17: typeName = 'Attachment'; break;
        case 18: typeName = 'Single Link'; break;
        case 20: typeName = 'Formula'; break;
        case 1003: typeName = 'Created Time'; break;
        case 1004: typeName = 'Modified Time'; break;
        default: typeName = `Type ${field.type}`;
      }
      console.log(`- ${field.field_name} (Type: ${typeName}, ID: ${field.field_id})`);
    });

  } catch (error) {
    console.error('Exception:', error.response?.data || error.message);
  }
}

main();
