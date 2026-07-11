const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const curlCmd = `docker exec -i tiktok_lark_api sh -c "curl -s -X POST http://localhost:3000/admin/test-order/push/583494921316304312"`;
    conn.exec(curlCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d))
              .on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
