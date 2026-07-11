const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const psqlCmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -t -c "SELECT order_id, lark_record_id FROM lark_records LIMIT 5;"`;
    conn.exec(psqlCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d))
              .on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
