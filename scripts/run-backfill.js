const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const conn = new Client();

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) return reject(err);
      console.log(`Uploaded ${localPath} -> ${remotePath}`);
      resolve();
    });
  });
}

conn.on('ready', () => {
  console.log('SSH connected.');
  conn.sftp(async (err, sftp) => {
    if (err) throw err;
    try {
      console.log('Uploading backfill script...');
      
      // Ensure remote scripts directory exists (might already exist, but fastPut handles it if path is fine, else we might need to mkdir)
      await new Promise((res, rej) => {
        sftp.mkdir('/root/Tiktok/scripts', (err) => {
          // ignore if exists
          res();
        });
      });

      await uploadFile(sftp, path.resolve(__dirname, 'query-shopee-return.js'), '/root/Tiktok/query-shopee-return.js');
      
      console.log('Upload complete. Running script in Docker container...');
      
      conn.exec('cd /root/Tiktok && docker cp query-shopee-return.js tiktok_lark_api:/app/query-shopee-return.js && docker exec tiktok_lark_api node /app/query-shopee-return.js', { pty: true }, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data))
              .stderr.on('data', data => process.stderr.write(data));
      });
    } catch (e) {
      console.error(e);
      conn.end();
    }
  });
}).connect(sshConfig);
