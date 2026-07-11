const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module');
    const { FailedDeliveryService } = require('./dist/src/modules/failed-delivery/failed-delivery.service');
    
    async function run() {
      console.log('Bootstrapping NestJS...');
      const app = await NestFactory.createApplicationContext(AppModule);
      console.log('App started. Getting FailedDeliveryService...');
      const service = app.get(FailedDeliveryService);
      console.log('Running reconcilePendingFailedDeliveries()...');
      await service.reconcilePendingFailedDeliveries();
      console.log('Done!');
      await app.close();
      process.exit(0);
    }
    run().catch(err => {
      console.error(err);
      process.exit(1);
    });
  `;
  
  // Create a temp file inside the container and run it from /app
  const cmd = `docker exec -i tiktok_lark_api sh -c "cat > /app/trigger.js && cd /app && node /app/trigger.js"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    // Write the script to stdin
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
