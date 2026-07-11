const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { LarkRecordService } = require('../dist/src/modules/lark/lark-record.service');

async function patch() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const larkService = app.get(LarkRecordService);
  
  const syncKey = 'TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584738947229582374_RETURN_4041133123427927078';
  
  console.log('Patching Lark record for order 584738947229582374...');
  try {
    const res = await larkService.upsertRecord({
      syncKey,
      fields: {
        'Ngày về kho': '2026/07/08 08:51'
      }
    });
    console.log('Patch result:', res);
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await app.close();
  process.exit(0);
}
patch();
