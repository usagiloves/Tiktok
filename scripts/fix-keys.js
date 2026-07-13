const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `sed -i 's/TIKTOK_APP_KEY=.*/TIKTOK_APP_KEY=6kj45ddae5l19/' /root/Tiktok/.env && sed -i 's/TIKTOK_APP_SECRET=.*/TIKTOK_APP_SECRET=92c4b83f97860b3101d55aa29c90289c211a551a/' /root/Tiktok/.env && docker restart tiktok_lark_api`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
