const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const allFailed = await prisma.normalizedRequest.findMany({
    where: {
      platform: 'TIKTOK',
      requestType: { in: ['Giao hàng thất bại', 'Đơn huỷ', 'Đơn THHT'] }
    },
    select: {
      orderId: true,
      internalStatus: true,
      warehouseReceivedAt: true,
      createdAt: true,
      requestType: true
    }
  });

  const failedDeliveries = allFailed.filter(x => x.requestType === 'Giao hàng thất bại');
  console.log(`Total Failed Deliveries in DB: ${failedDeliveries.length}`);
  
  const completed = failedDeliveries.filter(x => x.warehouseReceivedAt !== null);
  console.log(`Completed (warehouseReceivedAt != null): ${completed.length}`);
  
  const pending = failedDeliveries.filter(x => x.warehouseReceivedAt === null);
  console.log(`Pending (warehouseReceivedAt == null): ${pending.length}`);
  
  // Show a few pending
  console.log('Sample Pending:', pending.slice(0, 5));
  
  // Show a few completed
  console.log('Sample Completed:', completed.slice(0, 5));
  
  await prisma.$disconnect();
}

check().catch(console.error);
