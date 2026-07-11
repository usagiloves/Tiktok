const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { ReconcileService } = require('./dist/src/modules/reconcile/reconcile.service.js');
const { PrismaService } = require('./dist/src/common/prisma/prisma.service.js');

async function main() {
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconcileService = app.get(ReconcileService);
  const prisma = app.get(PrismaService);

  const shops = await prisma.shop.findMany({
    where: { isActive: true },
  });

  const fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00Z').getTime() / 1000);
  const toTimestamp = Math.floor(Date.now() / 1000);

  console.log(`Starting backfill from timestamp ${fromTimestamp} to ${toTimestamp}`);

  for (const shop of shops) {
    console.log(`\nBackfilling shop ${shop.shopName} (${shop.platform})`);
    
    if (shop.platform === 'SHOPEE' && shop.shopId === '986665118') {
      console.log('Testing Shopee Returns Reconcile for 15 days...');
      const currentTo = toTimestamp;
      const currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
      
      console.log(`--- Fetching Shopee Returns ${new Date(currentFrom * 1000).toISOString()} to ${new Date(currentTo * 1000).toISOString()} ---`);
      const rStats = await reconcileService.reconcileShopeeReturns(shop.shopId, currentFrom, currentTo);
      console.log('Shopee Returns stats:', rStats);
    }
  }

  console.log('\nBackfill completed!');
  await app.close();
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});
