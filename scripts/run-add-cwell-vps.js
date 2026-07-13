const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
const scriptContent = fs.readFileSync('d:\\Tiktok\\scripts\\add-cwell.js', 'utf8');

conn.on('ready', () => {
  console.log('SSH connection established. Executing add-cwell.js on VPS...');
  
  // Script to run on the VPS
  const script = `
    cat << 'EOF' > /root/add-cwell.js
${scriptContent}
EOF
    docker cp /root/add-cwell.js tiktok_lark_api:/app/add-cwell.js
    docker exec tiktok_lark_api node add-cwell.js
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
