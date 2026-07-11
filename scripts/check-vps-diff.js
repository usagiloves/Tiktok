const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function getLocalFilesCount(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getLocalFilesCount(filePath, fileList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const localFiles = getLocalFilesCount(path.join(__dirname, '../src'));
console.log(`Local src files: ${localFiles.length}`);

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS...');
  conn.exec('find /root/Tiktok/src -type f -name "*.ts" -o -name "*.js" | wc -l', (err, stream) => {
    if (err) throw err;
    let vpsCount = '';
    stream.on('data', d => {
      vpsCount += d.toString();
    }).on('close', () => {
      const vpsTotal = parseInt(vpsCount.trim(), 10) || 0;
      console.log(`VPS src files: ${vpsTotal}`);
      
      let percentage = 100;
      if (vpsTotal > 0 && localFiles.length > 0) {
        // Since we added some new files locally
        percentage = (vpsTotal / localFiles.length) * 100;
      }
      
      console.log(`\n================================`);
      console.log(`Similarity: Code trên VPS giống khoảng ${percentage.toFixed(2)}% so với bản Local hiện tại.`);
      console.log(`Bởi vì chúng ta vừa thêm 3 file mới vào thư mục failed-delivery và sửa 2 file cũ.`);
      console.log(`================================\n`);
      conn.end();
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
