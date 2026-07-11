const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut('scripts/test-jt-api.js', '/root/Tiktok/scripts/test-jt-api.js', (err) => {
      if (err) throw err;
      console.log('File copied. Running test...');
      conn.exec('docker cp /root/Tiktok/scripts/test-jt-api.js tiktok_lark_api:/app/test-jt-api.js && docker exec tiktok_lark_api node /app/test-jt-api.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d))
              .stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
      });
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
