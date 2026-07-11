const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const commands = [
  // Pull and start adminer
  `docker run -d --name adminer --restart=always -p 8080:8080 adminer`
];

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected.');
  const cmd = commands.join(' && ');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Done starting Adminer.');
      conn.end();
    }).on('data', data => process.stdout.write(data))
      .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
