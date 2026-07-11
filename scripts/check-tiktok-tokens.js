const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.tiktokToken.findMany();
  console.log('TikTok Tokens:');
  tokens.forEach(t => {
    console.log(`- Shop ID: ${t.shopId}, Shop Code: ${t.shopCode || 'N/A'}, CreatedAt: ${t.createdAt}, UpdatedAt: ${t.updatedAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
