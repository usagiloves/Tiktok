const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

conn.on('ready', () => {
    const psqlCmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -t -A -c "SELECT COUNT(*) FROM lark_records;"`;
    conn.exec(psqlCmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d; })
              .on('close', () => {
                  fs.writeFileSync('db-counts.txt', out.trim());
                  conn.end();
              });
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
