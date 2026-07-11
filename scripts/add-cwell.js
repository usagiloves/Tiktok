const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCwellShop() {
  const shopId = 'NHAP_MA_SHOP_CWELL_VAO_DAY'; // <-- BẠN THAY MÃ SHOP ID CỦA CWELL VÀO ĐÂY NHÉ
  
  const shop = await prisma.shop.upsert({
    where: { platform_shopId: { platform: 'TIKTOK', shopId } },
    update: {
      brand: 'CWELL',
      isActive: true
    },
    create: {
      platform: 'TIKTOK',
      shopId: shopId,
      shopName: 'CWELL TikTok Shop',
      brand: 'CWELL',
      isActive: true,
      timezone: 'Asia/Ho_Chi_Minh',
    }
  });

  console.log('✅ Đã thêm/cập nhật shop CWELL thành công:', shop);
}

addCwellShop()
  .catch(console.error)
  .finally(() => process.exit(0));
