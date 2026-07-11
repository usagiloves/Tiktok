/**
 * Trigger reconcile từ 06/06/2026 đến nay.
 * Xoá lark_records cũ, reset DB, rồi kéo lại toàn bộ.
 */
const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', data => { stdout += data.toString(); process.stdout.write(data); });
      stream.stderr.on('data', data => process.stderr.write(data));
      stream.on('close', () => resolve(stdout.trim()));
    });
  });
}

async function main() {
  const conn = new Client();
  
  conn.on('ready', async () => {
    console.log('=== Connected ===\n');
    
    try {
      // 1. Truncate lark_records
      console.log('--- Truncate lark_records ---');
      await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "TRUNCATE TABLE lark_records;"`);
      
      // 2. Reset update times and clean up unwanted records
      console.log('\n--- Reset update times and clean DB ---');
      await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "DELETE FROM normalized_requests WHERE request_type = 'ORDER' AND internal_status != 'Đã hủy';"`);
      await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "UPDATE normalized_requests SET last_tiktok_update_time = '1970-01-01T00:00:00Z';"`);
      
      // 3. Count
      console.log('\n--- Count records ---');
      await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -c "SELECT count(*) FROM normalized_requests;"`);
      
      // 4. Get shop_id
      const shopId = (await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml exec -T postgres psql -U admin -d tiktok_lark_sync -t -c "SELECT shop_id FROM shops WHERE is_active = true LIMIT 1;"`)).replace(/[\r\n\s]/g, '');
      console.log(`\nShop ID: ${shopId}`);
      
      // 5. Trigger reconcile from 06/06/2026
      console.log('\n--- Reconcile orders (06/06 -> now) ---');
      await runCommand(conn, `curl -s -X POST -H "Content-Type: application/json" -d '{"shop_id": "${shopId}", "from": "2026-06-06T00:00:00Z", "to": "2026-07-09T00:00:00Z"}' http://localhost:3000/admin/reconcile/orders`);
      
      console.log('\n--- Reconcile returns (06/06 -> now) ---');
      await runCommand(conn, `curl -s -X POST -H "Content-Type: application/json" -d '{"shop_id": "${shopId}", "from": "2026-06-06T00:00:00Z", "to": "2026-07-09T00:00:00Z"}' http://localhost:3000/admin/reconcile/returns`);
      
      // 6. Wait and check logs
      console.log('\n--- Waiting 20s then checking logs ---');
      await runCommand(conn, 'sleep 20');
      await runCommand(conn, `docker compose -f /root/Tiktok/docker-compose.yml logs --tail 30 api`);
      
    } catch (err) {
      console.error('Error:', err);
    } finally {
      conn.end();
    }
  });
  
  conn.connect(sshConfig);
}

main();
