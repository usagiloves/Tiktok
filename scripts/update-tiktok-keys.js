const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Updating TIKTOK_APP_KEY and SECRET...');
  
  const script = `
    cd /root/Tiktok
    
    # Cập nhật App Key và App Secret mới
    sed -i 's|^TIKTOK_APP_KEY=.*|TIKTOK_APP_KEY=6kabp6r4q63pc|' .env
    sed -i 's|^TIKTOK_APP_SECRET=.*|TIKTOK_APP_SECRET=b0ea627916dc11794a3fc6b02f41b9b9296ed83f|' .env
    
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
