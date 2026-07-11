const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { JtExpressClient } = require('./dist/src/modules/jt-express/jt-express.client.js');
const { JtExpressMapper } = require('./dist/src/modules/jt-express/jt-express.mapper.js');

async function main() {
  process.env.JT_ENABLED = 'true';
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const jtClient = app.get(JtExpressClient);
  const jtMapper = app.get(JtExpressMapper);

  const testBillCode = '842800765741'; // Provided from readme as example
  const testTxId = 'TESTID000001';

  console.log(`Calling J&T trace for billCode: ${testBillCode}...`);
  try {
    const rawResponse = await jtClient.trace(testTxId, [testBillCode]);
    console.log('Raw Response:', JSON.stringify(rawResponse, null, 2));

    if (rawResponse) {
      console.log('Mapping trace response...');
      const mapped = jtMapper.mapTraceResponse(rawResponse);
      console.log('Mapped Result:', JSON.stringify(mapped, null, 2));
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }

  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
