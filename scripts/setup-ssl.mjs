import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const domain = 'sunbox2.duckdns.org';

// Nginx configuration template
const nginxConfig = `
server {
    listen 80;
    server_name ${domain};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
`;

const commandsToRun = [
  // 1. Kill old cloudflare tunnel and anything on port 80
  'pkill cloudflared || true',
  'fuser -k 80/tcp || true',
  'fuser -k 443/tcp || true',
  
  // 2. Install Nginx and Certbot
  'apt-get update',
  'apt-get install -y nginx certbot python3-certbot-nginx',
  
  // 3. Write Nginx config
  `echo "${nginxConfig}" > /etc/nginx/sites-available/${domain}`,
  `ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`,
  'rm -f /etc/nginx/sites-enabled/default',
  
  // 4. Test and restart Nginx
  'nginx -t && systemctl restart nginx',
  
  // 5. Run Certbot to get SSL Certificate automatically
  `certbot --nginx -d ${domain} --non-interactive --agree-tos -m admin@${domain} --redirect`,
  
  // 6. Update APP_BASE_URL in .env
  `sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=https://${domain}|g" /root/Tiktok/.env`,
  
  // 7. Restart API to pick up new URL
  'cd /root/Tiktok && docker compose restart api'
];

console.log('Starting Nginx and SSL setup on VPS...');

const conn = new Client();
conn.on('ready', () => {
  const fullCommand = commandsToRun.join(' && ');
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log(`\\nDone! Status code: ${code}`);
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
