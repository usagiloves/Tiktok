const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { PrismaClient } = require('@prisma/client');
const { TiktokApiClient } = require('./dist/src/modules/tiktok/tiktok-api.client.js');
const fs = require('fs');
async function run() {
  const p = new PrismaClient();
  const shop = await p.shop.findFirst({where:{shopId:'7494498334469794054'}});
  const api = new TiktokApiClient({info:console.log, error:console.error, warn:console.warn, debug:console.log}, p);
  const from = Math.floor(new Date('2026-06-20T00:00:00Z').getTime()/1000);
  const to = Math.floor(new Date('2026-06-30T00:00:00Z').getTime()/1000);
  
  let out = "";
  
  const res = await api.getReturnList({shopId: shop.shopId, shopCipher: shop.shopCipher, updateTimeFrom: from, updateTimeTo: to, pageSize: 100 });
  out += 'Returns 6/20-6/30: ' + (res?.returns?.length || res?.return_refunds?.length || res?.return_orders?.length || 0) + '\\n';
  
  const res2 = await api.getOrderList({shopId: shop.shopId, shopCipher: shop.shopCipher, updateTimeFrom: from, updateTimeTo: to, pageSize: 100 });
  out += 'Orders 6/20-6/30: ' + (res2?.orders?.length || 0) + '\\n';

  const from2 = Math.floor(new Date('2026-07-01T00:00:00Z').getTime()/1000);
  const to2 = Math.floor(new Date('2026-07-09T23:59:59Z').getTime()/1000);

  const res3 = await api.getReturnList({shopId: shop.shopId, shopCipher: shop.shopCipher, updateTimeFrom: from2, updateTimeTo: to2, pageSize: 100 });
  out += 'Returns 7/1-7/9: ' + (res3?.returns?.length || res3?.return_refunds?.length || res3?.return_orders?.length || 0) + '\\n';
  
  const res4 = await api.getOrderList({shopId: shop.shopId, shopCipher: shop.shopCipher, updateTimeFrom: from2, updateTimeTo: to2, pageSize: 100 });
  out += 'Orders 7/1-7/9: ' + (res4?.orders?.length || 0) + '\\n';

  fs.writeFileSync('/tmp/out.log', out);
  process.exit(0);
}
run();
    `;
    const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/chk.js <<'EOF'\n${script}\nEOF\nnode /tmp/chk.js && cat /tmp/out.log"`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d)).on('close', () => conn.end());
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
