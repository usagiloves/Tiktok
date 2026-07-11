const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c "SELECT sync_key FROM lark_records ORDER BY updated_at DESC LIMIT 25;"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d).stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
