import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { LarkRecordService } from './src/modules/lark/lark-record.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const larkRecordService = app.get(LarkRecordService);
  
  const payloads = [
    {
      syncKey: "test_key_1",
      fields: { test: "test" }
    }
  ];
  
  try {
      const result = await larkRecordService.batchUpsertRecords(payloads);
      console.log("Result is:", result);
  } catch (e) {
      console.log("Error:", e);
  }
  await app.close();
}
bootstrap();
