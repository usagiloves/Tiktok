const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const pending = await prisma.normalizedRequest.findFirst({
    where: { platform: 'TIKTOK', warehouseReceivedAt: null, requestType: 'Giao hàng thất bại' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(pending ? JSON.stringify(pending.payload, null, 2) : 'Not found');
}
run().catch(console.error).finally(()=>prisma.$disconnect());
