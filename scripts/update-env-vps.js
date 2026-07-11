const { Client } = require('ssh2');
const fs = require('fs');
require('dotenv').config();

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commands = [
  `sed -i 's/^LARK_APP_ID=.*/LARK_APP_ID=<LARK_APP_ID>/' /root/Tiktok/.env`,
  `sed -i 's/^LARK_APP_SECRET=.*/LARK_APP_SECRET=<LARK_APP_SECRET>/' /root/Tiktok/.env`,
  `sed -i 's/^LARK_BASE_APP_TOKEN=.*/LARK_BASE_APP_TOKEN=<LARK_BASE_TOKEN>/' /root/Tiktok/.env`,
  `sed -i 's/^LARK_TABLE_ID_CSKH=.*/LARK_TABLE_ID_CSKH=tblcumPr02Uf7xGK/' /root/Tiktok/.env`,
  `grep -q '^SYNC_MIN_DATE=' /root/Tiktok/.env && sed -i 's/^SYNC_MIN_DATE=.*/SYNC_MIN_DATE=2026-06-06T00:00:00Z/' /root/Tiktok/.env || echo 'SYNC_MIN_DATE=2026-06-06T00:00:00Z' >> /root/Tiktok/.env`,
  // Also truncate lark_records table
  `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "TRUNCATE TABLE lark_records;"`
];

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected.');
  const cmd = commands.join(' && ');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Done modifying VPS .env and DB.');
      conn.end();
    }).on('data', data => process.stdout.write(data))
      .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
