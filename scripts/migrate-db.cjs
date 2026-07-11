const { exec } = require('child_process');
const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
  host: '160.191.89.216',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

console.log('1. Đang trích xuất dữ liệu từ Database ở máy cá nhân (Local)...');
exec('docker exec tiktok_lark_postgres pg_dump -U postgres -d tiktok_lark_sync -c > dump.sql', (err, stdout, stderr) => {
  if (err) {
    console.error('Lỗi khi dump db:', err);
    return;
  }
  console.log('Đã tạo xong file dump.sql');

  console.log('2. Đang kết nối VPS để truyền dữ liệu lên...');
  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      
      const readStream = fs.createReadStream('dump.sql');
      const writeStream = sftp.createWriteStream('/root/dump.sql');
      
      writeStream.on('close', () => {
        console.log('3. Đã tải file dump lên VPS thành công. Đang Import vào Database VPS...');
        
        conn.exec('cat /root/dump.sql | docker exec -i tiktok_lark_postgres psql -U postgres -d tiktok_lark_sync', (err, stream) => {
          if (err) throw err;
          stream.on('close', (code, signal) => {
            console.log('4. Đã khôi phục toàn bộ Token và Shop sang VPS thành công!');
            
            // Kích hoạt API đồng bộ ngay lập tức
            console.log('5. Đang kích hoạt tiến trình lấy đơn hàng thật...');
            conn.exec('curl -X POST http://localhost:3000/reconcile/trigger', (err2, stream2) => {
              stream2.on('close', () => {
                console.log('🚀 HOÀN TẤT! Đơn hàng đang được kéo về Lark!');
                conn.end();
              }).on('data', (d) => process.stdout.write(d));
            });
            
          }).on('data', (d) => process.stdout.write(d))
            .stderr.on('data', (d) => process.stderr.write(d));
        });
      });
      
      readStream.pipe(writeStream);
    });
  }).on('error', (err) => {
    console.error('Connection Error: ', err.message);
  }).connect(sshConfig);
});
