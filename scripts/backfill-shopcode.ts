import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ReconcileService } from '../src/modules/reconcile/reconcile.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconcileService = app.get(ReconcileService);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });

  const shops = await prisma.shop.findMany({
    where: { isActive: true },
  });

  // June 20, 2026, 00:00:00 (assuming current year is 2026)
  const fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00Z').getTime() / 1000);
  const toTimestamp = Math.floor(Date.now() / 1000);

  console.log(`Starting backfill from timestamp ${fromTimestamp} to ${toTimestamp}`);

  for (const shop of shops) {
    console.log(`\nBackfilling shop ${shop.shopName} (${shop.platform})`);
    
    if (shop.platform === 'TIKTOK') {
      console.log('--- Fetching Returns ---');
      const rStats = await reconcileService.reconcileReturns(shop.shopId, fromTimestamp, toTimestamp);
      console.log('Returns stats:', rStats);
      
      console.log('--- Fetching Orders ---');
      const oStats = await reconcileService.reconcileOrders(shop.shopId, fromTimestamp, toTimestamp);
      console.log('Orders stats:', oStats);
    } else if (shop.platform === 'SHOPEE') {
      console.log('Shopee API max range is 15 days, we will just use the current backfill cron for Shopee');
      // For now, Shopee is not the main focus, we'll run 15-day chunks if needed
      let currentTo = toTimestamp;
      while (currentTo > fromTimestamp) {
        const currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
        console.log(`--- Fetching Shopee Returns ${new Date(currentFrom * 1000).toISOString()} to ${new Date(currentTo * 1000).toISOString()} ---`);
        const rStats = await reconcileService.reconcileShopeeReturns(shop.shopId, currentFrom, currentTo);
        console.log('Shopee Returns stats:', rStats);
        
        console.log(`--- Fetching Shopee Orders ${new Date(currentFrom * 1000).toISOString()} to ${new Date(currentTo * 1000).toISOString()} ---`);
        const oStats = await reconcileService.reconcileShopeeOrders(shop.shopId, currentFrom, currentTo);
        console.log('Shopee Orders stats:', oStats);

        currentTo = currentFrom;
      }
    }
  }

  console.log('\nBackfill completed!');
  await app.close();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});
