const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { ReconcileService } = require('./dist/src/modules/reconcile/reconcile.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconcileService = app.get(ReconcileService);
  
  const fromTimestamp = Math.floor(new Date('2026-06-20T00:00:00Z').getTime() / 1000);
  const nowTimestamp = Math.floor(new Date().getTime() / 1000);
  const shopId = '986665118';
  
  console.log("Starting Shopee sweep...");
  let currentTo = nowTimestamp;
  let currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
  
  let orderStats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
  let returnStats = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
  
  while (currentTo > fromTimestamp) {
    console.log(`Sweeping chunk: ${new Date(currentFrom*1000).toISOString()} to ${new Date(currentTo*1000).toISOString()}`);
    const oStats = await reconcileService.reconcileShopeeOrders(shopId, currentFrom, currentTo);
    const rStats = await reconcileService.reconcileShopeeReturns(shopId, currentFrom, currentTo);
    
    if (oStats) { 
       orderStats.total += oStats.total; 
       orderStats.created += oStats.created;
       orderStats.updated += oStats.updated; 
       orderStats.skipped += oStats.skipped; 
       orderStats.errors += oStats.errors; 
    }
    if (rStats) { 
       returnStats.total += rStats.total; 
       returnStats.created += rStats.created;
       returnStats.updated += rStats.updated; 
       returnStats.skipped += rStats.skipped; 
       returnStats.errors += rStats.errors; 
    }
    
    currentTo = currentFrom;
    currentFrom = Math.max(fromTimestamp, currentTo - 15 * 24 * 60 * 60);
  }

  console.log("Orders:", orderStats);
  console.log("Returns:", returnStats);
  
  await app.close();
}
test();
