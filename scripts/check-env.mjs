import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commandsToRun = [
  'cat /root/Tiktok/.env | grep TIKTOK_APP'
];

const conn = new Client();
conn.on('ready', () => {
  const fullCommand = commandsToRun.join(' && ');
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
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
