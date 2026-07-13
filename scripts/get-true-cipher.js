const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function run() {
  try {
    const tokenRecord = await prisma.tiktokToken.findUnique({
      where: { shopId: 'VNLCLBWL3X' }
    });
    
    if (!tokenRecord) {
      console.log('NO TOKEN FOUND FOR VNLCLBWL3X');
      return;
    }
    
    const accessToken = tokenRecord.accessToken;
    const appKey = '6kabp6r4q63pc';
    const appSecret = 'b0ea627916dc11794a3fc6b02f41b9b9296ed83f';
    const timestamp = Math.floor(Date.now() / 1000);
    
    const params = {
      app_key: appKey,
      timestamp: timestamp,
    };
    
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(k => k + params[k]).join('');
    
    const baseString = appSecret + '/authorization/202309/shops' + paramString + appSecret;
    const sign = crypto.createHmac('sha256', appSecret).update(baseString).digest('hex');
    
    params.sign = sign;
    
    const url = 'https://open-api.tiktokglobalshop.com/authorization/202309/shops';
    
    console.log('Calling API...');
    const res = await axios.get(url, {
      params,
      headers: {
        'x-tts-access-token': accessToken,
        'content-type': 'application/json'
      }
    });
    
    if (res.data && res.data.data && res.data.data.shops) {
      const shops = res.data.data.shops;
      if (shops.length > 0) {
        const cipher = shops[0].cipher;
        console.log('TRUE SHOP CIPHER IS:', cipher);
        
        await prisma.shop.update({
          where: { platform_shopId: { platform: 'TIKTOK', shopId: 'VNLCLBWL3X' } },
          data: { shopCipher: cipher }
        });
        console.log('Updated shop_cipher in DB to:', cipher);
      } else {
        console.log('No shops found in API response');
      }
    } else {
      console.log('Unexpected response:', JSON.stringify(res.data));
    }
  } catch (err) {
    console.error('ERROR:', err.response ? JSON.stringify(err.response.data) : err.message);
  } finally {
    process.exit(0);
  }
}
run();
  `;
  
  const cmd = `docker exec -i -w /app tiktok_lark_api sh -c "cat > /app/getcipher.js << 'EOF'
${scriptContent}
EOF
node /app/getcipher.js"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
