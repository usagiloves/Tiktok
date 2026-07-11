const { Client } = require('ssh2');
const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};
const conn = new Client();
conn.on('ready', () => {
  conn.exec('cd /root/Tiktok && docker compose exec postgres psql -U admin -d tiktok_lark_sync -c "TRUNCATE TABLE normalized_requests;"', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data)).stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
