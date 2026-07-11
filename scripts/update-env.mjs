import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commandsToRun = [
  // Cập nhật TIKTOK_APP_KEY
  `sed -i "s|^TIKTOK_APP_KEY=.*|TIKTOK_APP_KEY=6kj45ddae5l19|g" /root/Tiktok/.env`,
  
  // Cập nhật TIKTOK_APP_SECRET
  `sed -i "s|^TIKTOK_APP_SECRET=.*|TIKTOK_APP_SECRET=<TIKTOK_APP_SECRET>|g" /root/Tiktok/.env`,
  
  // Restart lại API để nhận biến mới
  'cd /root/Tiktok && docker compose restart api'
];

console.log('Đang cập nhật TikTok App Key và Secret trên VPS...');

const conn = new Client();
conn.on('ready', () => {
  const fullCommand = commandsToRun.join(' && ');
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log(`\\nĐã cập nhật xong!`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection Error: ', err.message);
}).connect(sshConfig);
