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
        output += data;
      });
    });
  });
}

conn.on('ready', async () => {
  const cmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -x -c "SELECT payload_snapshot FROM sync_logs WHERE sync_key LIKE '%584604550455002916%';"`;
  console.log(await runCommand(conn, cmd));
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
