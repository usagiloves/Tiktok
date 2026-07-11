import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const domain = 'sunbox2.duckdns.org';

const commandsToRun = [
  'fuser -k 80/tcp || true',
  'rm -f /etc/nginx/sites-enabled/default',
  'nginx -t',
  'systemctl restart nginx',
  'systemctl status nginx --no-pager',
  `certbot --nginx -d ${domain} --non-interactive --agree-tos -m admin@${domain} --redirect`,
  `sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=https://${domain}|g" /root/Tiktok/.env`,
  'cd /root/Tiktok && docker compose restart api'
];

const conn = new Client();
conn.on('ready', () => {
  const fullCommand = commandsToRun.join(' && ');
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => process.stdout.write(data))
      .stderr.on('data', (data) => process.stderr.write(data));
  });
}).on('error', (err) => console.error(err)).connect(sshConfig);
