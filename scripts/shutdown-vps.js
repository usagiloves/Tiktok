const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected. Shutting down system...');
  conn.exec('cd /root/Tiktok && docker compose down', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('System shut down with code ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
