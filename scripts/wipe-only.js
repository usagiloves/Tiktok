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
  console.log('Connected via SSH. Wiping cache...');
  
  // Truncate postgres tables
  const psqlCmd = `docker exec -i tiktok_lark_postgres psql -U admin -d tiktok_lark_sync -c 'TRUNCATE TABLE lark_records, normalized_requests, sync_logs CASCADE;'`;
  console.log('Truncating database...');
  const res = await runCommand(conn, psqlCmd);
  console.log(res);
  
  // Flush redis
  const redisCmd = `docker exec -i tiktok_lark_redis redis-cli FLUSHALL`;
  console.log('Flushing Redis...');
  const resRedis = await runCommand(conn, redisCmd);
  console.log(resRedis);
  
  console.log('Wipe complete!');
  conn.end();
}).connect({
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
});
