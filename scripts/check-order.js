const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const req = await prisma.normalizedRequest.findFirst({
    where: { orderId: '584604550455002916' }
  });
  console.log("Normalized Request:");
  console.log(JSON.stringify(req, null, 2));

  const log = await prisma.syncLog.findFirst({
    where: { syncKey: req?.syncKey }
  });
  console.log("\nSync Log:");
  console.log(JSON.stringify(log, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
