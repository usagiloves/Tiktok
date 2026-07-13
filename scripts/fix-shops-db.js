const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.tiktokToken.findMany();
  console.log("Tokens:", tokens.map(t => t.shopId));
  
  const shops = await prisma.shop.findMany();
  console.log("Shops:", shops.map(s => s.shopId));
  
  for (const token of tokens) {
    if (!shops.find(s => s.shopId === token.shopId)) {
      console.log("Missing shop for token:", token.shopId);
      
      await prisma.shop.create({
        data: {
          shopId: token.shopId,
          shopName: "GOODFIT Vietnam",
          platform: "TIKTOK",
          isActive: true,
          brand: "Goodfit",
          shopCipher: "none",
          shopCode: "GF"
        }
      });
      
      console.log("Created shop for", token.shopId);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
