import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TiktokApiClient } from './modules/tiktok/tiktok-api.client';
import { PrismaService } from './common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tiktokApi = app.get(TiktokApiClient);
  const prisma = app.get(PrismaService);

  const shop = await prisma.shop.findFirst({ where: { platform: 'TIKTOK', isActive: true } });
  if (!shop) {
    console.log('No active TikTok shop found');
    await app.close();
    return;
  }
  
  const pending = await prisma.normalizedRequest.findFirst({
    where: { 
      platform: 'TIKTOK', 
      warehouseReceivedAt: null,
      requestType: { in: ['Đơn huỷ', 'Đơn THHT', 'Giao hàng thất bại', 'ORDER', 'RETURN', 'REFUND'] },
      internalStatus: { in: ['Đang hoàn', 'Chưa về kho'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  const returned = await prisma.normalizedRequest.findFirst({
    where: { 
      platform: 'TIKTOK', 
      warehouseReceivedAt: { not: null },
      requestType: { in: ['Đơn huỷ', 'Đơn THHT', 'Giao hàng thất bại', 'ORDER', 'RETURN', 'REFUND'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- PENDING ORDER DB RECORD ---');
  if (pending) {
    console.log(`Order ID: ${pending.orderId}`);
    try {
      const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', pending.orderId);
      console.log('API Response Status:', res.orders[0]?.order_status);
      console.log('API Response Update Time:', res.orders[0]?.update_time);
      console.log('API Full Response:', JSON.stringify(res.orders[0], null, 2));
    } catch(e: any) {
      console.error('API Error:', e.message);
    }
  } else {
    console.log('No pending order found in DB.');
  }

  console.log('\n--- RETURNED ORDER DB RECORD ---');
  if (returned) {
    console.log(`Order ID: ${returned.orderId}`);
    try {
      const res = await tiktokApi.getOrderDetail(shop.shopId, shop.shopCipher || '', returned.orderId);
      console.log('API Response Status:', res.orders[0]?.order_status);
      console.log('API Response Update Time:', res.orders[0]?.update_time);
      console.log('API Full Response:', JSON.stringify(res.orders[0], null, 2));
    } catch(e: any) {
      console.error('API Error:', e.message);
    }
  } else {
    console.log('No returned order found in DB.');
  }

  await app.close();
}
bootstrap();
