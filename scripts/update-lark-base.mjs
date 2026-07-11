import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commandsToRun = [
  'sed -i "s|^LARK_BASE_APP_TOKEN=.*|LARK_BASE_APP_TOKEN=GjZkbn6EEavyqisf1VgjMTEjpmc|g" /root/Tiktok/.env',
  'sed -i "s|^LARK_TABLE_ID_CSKH=.*|LARK_TABLE_ID_CSKH=ldxry9f5zuUcVJsL|g" /root/Tiktok/.env',
  // Xử lý trường hợp dòng chưa tồn tại trong .env
  'grep -q "^LARK_BASE_APP_TOKEN=" /root/Tiktok/.env || echo "LARK_BASE_APP_TOKEN=GjZkbn6EEavyqisf1VgjMTEjpmc" >> /root/Tiktok/.env',
  'grep -q "^LARK_TABLE_ID_CSKH=" /root/Tiktok/.env || echo "LARK_TABLE_ID_CSKH=ldxry9f5zuUcVJsL" >> /root/Tiktok/.env',
  
  'cd /root/Tiktok && docker compose up -d'
];

const conn = new Client();
conn.on('ready', () => {
  const fullCommand = commandsToRun.join(' && ');
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
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
