const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  console.log("=== Querying webhook_events for order_id 584604550455002916 ===");
  const events = await prisma.webhookEvent.findMany({
    where: {
      orderId: '584604550455002916'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });
  
  if (events.length > 0) {
      console.log(`FOUND ${events.length} EVENTS`);
      events.forEach(e => {
          console.log(`Event Type: ${e.eventType}`);
          console.log(JSON.stringify(e.rawPayload, null, 2));
      });
  } else {
      console.log("No webhook events found for this order.");
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
