const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const token = await prisma.tiktokToken.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!token) {
      console.log('No token found');
      return;
    }
    const shopId = token.shopId;
    console.log('Token found for shop:', shopId);
    
    await prisma.shop.upsert({
      where: {
        platform_shopId: {
          platform: 'TIKTOK',
          shopId: shopId,
        }
      },
      update: {
        isActive: true,
      },
      create: {
        platform: 'TIKTOK',
        shopId: shopId,
        shopName: 'My Shop',
        brand: 'My Brand',
        shopCipher: 'Unknown',
        isActive: true,
        timezone: 'Asia/Ho_Chi_Minh',
      }
    });
    console.log('Shop upserted successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
