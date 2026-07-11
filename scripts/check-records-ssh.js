const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const records = await prisma.larkRecord.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  console.log("RECORDS:");
  console.log(JSON.stringify(records, null, 2));
  process.exit(0);
}
run();
    `;
    const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /tmp/chk.js <<'EOF'\n${script}\nEOF\nnode /tmp/chk.js"`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString())).on('close', () => { setTimeout(()=>conn.end(), 1000) });
    });
}).connect({host: '<VPS_IP>',port: 22,username: 'root',password: '<VPS_PASSWORD>'});
