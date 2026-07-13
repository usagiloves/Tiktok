const { spawn } = require('child_process');
const { Client } = require('ssh2');

async function run() {
  console.log('Copying src folder to VPS...');
  const rsync = spawn('rsync', ['-avz', '--delete', '-e', 'ssh', 'src/', 'root@160.191.89.216:/root/Tiktok/src/']);
  
  rsync.stdout.on('data', d => process.stdout.write(d));
  rsync.stderr.on('data', d => process.stderr.write(d));
  
  await new Promise(resolve => rsync.on('close', resolve));
  
  console.log('Rebuilding on VPS...');
  const conn = new Client();
  conn.on('ready', () => {
    // We have docker-compose build and up
    const cmd = `cd /root/Tiktok && docker compose build api && docker compose up -d api`;
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('data', d => process.stdout.write(d))
            .stderr.on('data', d => process.stderr.write(d));
      stream.on('close', () => conn.end());
    });
  }).connect({ host: '160.191.89.216', port: 22, username: 'root', password: 'Sunbox@891' });
}
run();
