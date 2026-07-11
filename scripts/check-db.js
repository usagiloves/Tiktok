const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const shops = await prisma.shop.findMany();
    const tokens = await prisma.tiktokToken.findMany();
    console.log('Shops in DB:', JSON.stringify(shops, null, 2));
    console.log('Tokens in DB:', JSON.stringify(tokens, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
