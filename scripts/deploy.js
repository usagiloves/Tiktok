const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const files = [
      'dist/src/app.module.js',
      'dist/src/modules/sync/normalizer.service.js',
      'dist/src/modules/reconcile/reconcile.module.js',
      'dist/src/modules/reconcile/reconcile.service.js',
      'dist/src/modules/jt-express/jt-express.client.js',
      'dist/src/modules/jt-express/jt-express.mapper.js',
      'dist/src/modules/jt-express/jt-express.module.js',
      'dist/src/modules/sync/sync-engine.service.js',
      'dist/src/modules/admin/admin.controller.js',
      'dist/src/modules/sync/sync-worker.js',
      'dist/src/modules/failed-delivery/failed-delivery.module.js',
      'dist/src/modules/failed-delivery/failed-delivery.service.js',
      'dist/src/modules/failed-delivery/failed-delivery.scheduler.js'
    ];
    
    // Tạo folder jt-express và failed-delivery trên server nếu chưa có
    conn.exec('mkdir -p /root/Tiktok/dist/src/modules/jt-express /root/Tiktok/dist/src/modules/failed-delivery && docker exec tiktok_lark_api mkdir -p /app/dist/src/modules/jt-express /app/dist/src/modules/failed-delivery', (err, stream) => {
      stream.on('data', d => console.log(d.toString()));
      stream.stderr.on('data', d => console.error(d.toString()));
      stream.on('close', () => {
        let currentIndex = 0;
        const uploadNext = () => {
          if (currentIndex >= files.length) {
            console.log('All files copied. Copying to docker and restarting...');
            const cpCmds = files.map(f => `docker cp /root/Tiktok/${f} tiktok_lark_api:/app/${f}`).join(' && ');
            conn.exec(`${cpCmds} && cd /root/Tiktok && docker compose restart api`, (err, stream) => {
              if (err) throw err;
              stream.on('data', d => process.stdout.write(d))
                    .stderr.on('data', d => process.stderr.write(d));
              stream.on('close', () => conn.end());
            });
            return;
          }
          const file = files[currentIndex];
          sftp.fastPut(file, `/root/Tiktok/${file}`, (err) => {
            if (err) { console.error('Failed to upload', file); throw err; }
            console.log('Uploaded', file);
            currentIndex++;
            uploadNext();
          });
        };
        uploadNext();
      });
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
