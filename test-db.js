const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const conf = `server {
    server_name sunbox2.duckdns.org;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        send_timeout 300s;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/sunbox2.duckdns.org/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/sunbox2.duckdns.org/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = sunbox2.duckdns.org) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name sunbox2.duckdns.org;
    return 404; # managed by Certbot
}`; 
  const b64 = Buffer.from(conf).toString('base64');
  conn.exec(`echo "${b64}" | base64 -d > /etc/nginx/sites-enabled/sunbox2.duckdns.org && nginx -s reload`, (err, stream) => { 
    let out = ''; 
    stream.on('data', d => out += d).on('close', () => { console.log(out); conn.end(); }); 
    stream.stderr.on('data', d => out += d); 
  }); 
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
