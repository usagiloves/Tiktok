const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { SyncEngineService } = require('./dist/src/modules/sync/sync-engine.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncEngine = app.get(SyncEngineService);
  
  const mockReturns = [
    {
      return_sn: 'RET123',
      create_time: 1779951600, // May 15, 2026
      update_time: 1779951600
    },
    {
      return_sn: 'RET124',
      create_time: 1782259200, // June 25, 2026
      update_time: 1782259200
    }
  ];
  
  console.log("Calling syncReturnsBatch with mock data...");
  const res = await syncEngine.syncReturnsBatch(mockReturns, { platform: 'SHOPEE', shopId: '986665118' }, 'MANUAL_TEST');
  console.log("Result:", res);
  await app.close();
}
test();
