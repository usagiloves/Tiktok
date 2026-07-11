const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const shops = await prisma.shop.findMany();
  console.log("SHOPS:", shops);
  process.exit(0);
}
run();
