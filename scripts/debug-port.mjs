import { Client } from 'ssh2';

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commandsToRun = `
echo "=== Port 80 users ==="
netstat -tulpn | grep :80 || echo "Nothing on port 80"
echo "=== Nginx status ==="
systemctl status nginx --no-pager || echo "Nginx status failed"
echo "=== Nginx logs ==="
journalctl -xeu nginx --no-pager | tail -n 20 || echo "No logs"
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(commandsToRun, (err, stream) => {
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
