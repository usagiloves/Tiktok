const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { PrismaService } = require('./dist/src/common/prisma/prisma.service');
    const { getQueueToken } = require('@nestjs/bullmq');
    const { QUEUE_NAMES, JOB_NAMES } = require('./dist/src/common/constants');
    
    async function run() {
      console.log('Bootstrapping application...');
      const app = await NestFactory.createApplicationContext(AppModule);
      const prisma = app.get(PrismaService);
      const syncQueue = app.get(getQueueToken(QUEUE_NAMES.SYNC_ORDER));
    
      // Lấy 1 đơn Giao hàng thất bại đang pending (Chưa về kho)
      const pending = await prisma.normalizedRequest.findFirst({
        where: {
          platform: 'TIKTOK',
          internalStatus: 'Đang hoàn',
          warehouseReceivedAt: null
        }
      });
      
      if (!pending) {
        console.log('Không tìm thấy đơn pending nào để test!');
        await app.close();
        return;
      }
      
      console.log('Đã tìm thấy đơn để test:', pending.orderId);
      
      // Đẩy vào Queue, giả lập như Radar vừa check thấy order_status = COMPLETED
      await syncQueue.add(JOB_NAMES.SYNC_ORDER_TO_LARK, {
        orderId: pending.orderId,
        shopId: pending.shopId,
        source: 'MANUAL_TEST',
        isFailedDelivery: true,
        warehouseReceivedAtMs: Date.now()
      });
      
      console.log('Đã ném đơn', pending.orderId, 'vào Queue thành công! Worker sẽ tự động bốc lên Lark.');
      await app.close();
      process.exit(0);
    }
    
    run().catch(err => {
      console.error(err);
      process.exit(1);
    });
  `;
  
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /app/trigger.js && cd /app && node /app/trigger.js"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.write(script);
    stream.end();
    stream.on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      console.log('\nVPS execution finished.');
      conn.end();
    });
  });
}).connect({ host: '<VPS_IP>', port: 22, username: 'root', password: '<VPS_PASSWORD>' });
