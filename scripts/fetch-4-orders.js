const { Client } = require('ssh2');

const conn = new Client();

async function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    let output = '';
    conn.exec(cmd, (err, stream) => {
      if (err) reject(err);
      stream.on('close', () => resolve(output)).on('data', data => {
        output += data;
      }).stderr.on('data', data => {
        // ignore stderr for raw json
      });
    });
  });
}

const orders = [
  '584906968398922962',
  '584878715104692203',
  '584852942476444884',
  '584836838545786734'
];

conn.on('ready', async () => {
  const results = {};
  for (const id of orders) {
    const raw = await runCommand(conn, `curl -s http://localhost:3000/admin/test-order/${id}`);
    try {
      results[id] = JSON.parse(raw);
    } catch (e) {
      results[id] = raw;
    }
  }
  console.log(JSON.stringify(results, null, 2));
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
