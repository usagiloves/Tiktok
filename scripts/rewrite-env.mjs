import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const envContentBase64 = Buffer.from(`PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tiktok_lark_sync?schema=public
REDIS_URL=redis://redis:6379

TIKTOK_APP_KEY=6kj45ddae5l19
TIKTOK_APP_SECRET=<TIKTOK_APP_SECRET>

LARK_APP_ID=<LARK_APP_ID_2>
LARK_APP_SECRET=<LARK_APP_SECRET_2>
LARK_BASE_APP_TOKEN=<LARK_BASE_TOKEN_2>
LARK_ORDER_TABLE_ID=tblOeO9RTCQdAnqg
LARK_RETURN_TABLE_ID=tblOeO9RTCQdAnqg
LARK_TABLE_ID_CSKH=tblOeO9RTCQdAnqg

DOMAIN_URL=https://sunbox2.duckdns.org
TOKEN_ENCRYPTION_KEY=change_me_in_production_32chars!
OAUTH_STATE_SECRET=change_me_in_production_123!
`).toString('base64');

const commandsToRun = [
  `echo "${envContentBase64}" | base64 -d > /root/Tiktok/.env`,
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
