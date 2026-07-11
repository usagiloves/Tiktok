const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commands = [
  `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "SELECT count(*) FROM lark_records;"`
];

const conn = new Client();
conn.on('ready', () => {
  const cmd = commands.join(' && ');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', data => process.stdout.write(data))
      .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
