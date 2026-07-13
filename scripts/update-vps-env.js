const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Updating .env...');
  
  // Script to run on the VPS
  const script = `
    cd /root/Tiktok
    
    # Cập nhật APP_BASE_URL và Redirect URI
    sed -i 's|^APP_BASE_URL=.*|APP_BASE_URL=https://sunbox2.duckdns.org|' .env
    sed -i 's|^TIKTOK_REDIRECT_URI=.*|TIKTOK_REDIRECT_URI=https://sunbox2.duckdns.org/tiktok/oauth/callback|' .env
    
    # Cập nhật thông tin Lark Base mới
    sed -i 's|^LARK_BASE_APP_TOKEN=.*|LARK_BASE_APP_TOKEN=D77GwIjOFirA6ik0XAWjFe7LpGd|' .env
    sed -i 's|^LARK_TABLE_ID_CSKH=.*|LARK_TABLE_ID_CSKH=tblHnFgQ9Ya0NeFk|' .env
    
    echo "Restarting API container..."
    docker restart tiktok_lark_api
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
