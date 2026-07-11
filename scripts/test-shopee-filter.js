const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module.js');
const { SyncEngineService } = require('../dist/src/modules/sync/sync-engine.service.js');
const { ReconcileService } = require('../dist/src/modules/reconcile/reconcile.service.js');

async function main() {
  console.log('Initializing NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconcileService = app.get(ReconcileService);
  const syncEngine = app.get(SyncEngineService);

  // Mock ShopeeApi inside ReconcileService
  reconcileService.shopeeApi = {
    getUpdatedOrders: async () => {
      return [
        {
          order_sn: 'ORDER_COMPLETED',
          order_status: 'COMPLETED',
          cancel_by: '',
          cancel_reason: ''
        },
        {
          order_sn: 'ORDER_BUYER_CANCELLED',
          order_status: 'CANCELLED',
          cancel_by: 'BUYER',
          cancel_reason: 'Change mind'
        },
        {
          order_sn: 'ORDER_SELLER_CANCELLED',
          order_status: 'CANCELLED',
          cancel_by: 'SELLER',
          cancel_reason: 'Out of stock'
        },
        {
          order_sn: 'ORDER_LOGISTICS_FAILED',
          order_status: 'CANCELLED',
          cancel_by: 'LOGISTICS',
          cancel_reason: 'Delivery attempt failed'
        }
      ];
    }
  };

  // Mock Prisma inside ReconcileService
  reconcileService.prisma = {
    shop: {
      findFirst: async () => ({ shopId: '986665118', platform: 'SHOPEE', brand: 'TEST_BRAND', shopCode: 'TEST_CODE', isActive: true })
    }
  };

  // Override syncOrdersBatch to just intercept and log instead of actually syncing to DB
  let interceptedOrders = [];
  syncEngine.syncOrdersBatch = async (orders, shopMeta, source) => {
    interceptedOrders = orders;
    return { total: orders.length, created: 0, updated: orders.length, skipped: 0, errors: 0 };
  };

  console.log('Running reconcileShopeeOrders with mocked orders...');
  
  // We use shopId 986665118 to get a valid DB shop reference
  await reconcileService.reconcileShopeeOrders('986665118', 0, 0);

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(`Expected surviving orders: 1`);
  console.log(`Actual surviving orders: ${interceptedOrders.length}`);
  
  if (interceptedOrders.length > 0) {
    console.log(`Surviving Order SN: ${interceptedOrders[0].order_sn}`);
    console.log(`Flag _is_failed_delivery: ${interceptedOrders[0]._is_failed_delivery}`);
  }

  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
