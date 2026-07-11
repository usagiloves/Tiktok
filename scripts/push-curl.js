const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const shopId = '7494498334469794054';
    const from = new Date('2026-04-15T00:00:00Z').toISOString();
    const to = new Date('2026-04-25T00:00:00Z').toISOString();

    const from2 = new Date('2026-06-01T00:00:00Z').toISOString();
    const to2 = new Date('2026-07-09T00:00:00Z').toISOString();

    const curlCmd = `docker exec -i tiktok_lark_api sh -c "curl -s -X POST -H 'Content-Type: application/json' -d '{\\"shop_id\\": \\"${shopId}\\", \\"from\\": \\"${from}\\", \\"to\\": \\"${to}\\"}' http://localhost:3000/admin/reconcile/orders && echo '' && curl -s -X POST -H 'Content-Type: application/json' -d '{\\"shop_id\\": \\"${shopId}\\", \\"from\\": \\"${from2}\\", \\"to\\": \\"${to2}\\"}' http://localhost:3000/admin/reconcile/orders"`;

    conn.exec(curlCmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d); })
              .on('close', () => {
                  console.log("\nFinished curl!");
                  conn.end();
              });
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
