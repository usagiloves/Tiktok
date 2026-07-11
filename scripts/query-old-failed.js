const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Querying all TIKTOK orders with internalStatus = Đã hủy...');
  
  const canceledOrders = await prisma.normalizedRequest.findMany({
    where: {
      platform: 'TIKTOK',
      internalStatus: 'Đã hủy',
    },
    select: {
      orderId: true,
      payload: true,
      createdAt: true,
    }
  });

  console.log(`Total Đã hủy in DB: ${canceledOrders.length}`);
  
  let oldFailedDeliveries = [];
  
  for (const o of canceledOrders) {
    if (o.payload) {
      const reason = String(o.payload.cancel_reason || o.payload.cancellation_reason || '').toUpperCase();
      const initiator = String(o.payload.cancellation_initiator || o.payload.cancel_initiator || '').toUpperCase();
      
      if (initiator === 'BUYER' || reason.includes('BUYER')) continue;
      if (initiator === 'SELLER' || reason.includes('SELLER')) continue;
      
      if (
        initiator === 'LOGISTICS' || 
        reason.includes('DELIVERY') || 
        reason.includes('FAIL') || 
        reason.includes('THẤT BẠI') || 
        reason.includes('GIAO GÓI HÀNG') ||
        (initiator === 'SYSTEM' && (reason.includes('GIAO') || reason.includes('DELIVERY')))
      ) {
        oldFailedDeliveries.push(o);
      }
    }
  }
  
  console.log(`Found ${oldFailedDeliveries.length} orders that were actually FAILED DELIVERIES but saved as 'Đã hủy'.`);
  
  if (oldFailedDeliveries.length > 0) {
    console.log('Sample Old Failed Deliveries:', oldFailedDeliveries.slice(0, 5).map(x => x.orderId));
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
