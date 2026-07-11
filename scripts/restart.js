const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker restart tiktok_lark_api', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => { conn.end(); }).on('data', data => console.log(data.toString()));
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
