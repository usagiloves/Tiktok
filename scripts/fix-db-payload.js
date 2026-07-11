const { Client } = require('pg');

const conn = new Client({
  host: '<VPS_IP>',
  port: 5432,
  database: 'tiktok_lark_sync',
  user: 'admin',
  password: '<VPS_PASSWORD>'
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', data => process.stdout.write(data))
      .stderr.on('data', data => process.stderr.write(data));
  });
}).connect(sshConfig);
