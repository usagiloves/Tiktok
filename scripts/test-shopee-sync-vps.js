const { Client } = require('ssh2');

const sshConfig = {
  host: '<VPS_IP>',
  port: 22,
  username: 'root',
  password: '<VPS_PASSWORD>'
};

const script = `
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('./dist/src/app.module.js');
  const { SyncEngineService } = require('./dist/src/modules/sync/sync-engine.service.js');
  const { ShopeeApiClient } = require('./dist/src/modules/shopee/shopee-api.client.js');

  async function main() {
    console.log('Initializing NestJS Application Context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const syncEngine = app.get(SyncEngineService);
    const shopeeApi = app.get(ShopeeApiClient);

    const shopId = '986665118';
    
    console.log('Fetching return detail from Shopee...');
    const detail = await shopeeApi.getReturnDetail(shopId, '2305270RKKMVHFD');
    
    if (!detail) {
      console.log('Failed to fetch detail');
      process.exit(1);
    }

    const now = Math.floor(Date.now() / 1000);
    detail.create_time = now;
    detail.update_time = now;
    if (detail.order_create_time) detail.order_create_time = now;

    const shopMeta = {
      shopId,
      brand: 'TEST_BRAND',
      shopCode: 'TEST_CODE',
      platform: 'SHOPEE',
    };

    console.log('Syncing return to Lark...');
    const stats = await syncEngine.syncReturnsBatch([detail], shopMeta, 'RETURN', 'MANUAL_TEST');
    
    console.log('Sync result:', stats);
    
    await app.close();
  }

  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `docker exec -i tiktok_lark_api node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  console.log('Running test script on VPS...');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect(sshConfig);
