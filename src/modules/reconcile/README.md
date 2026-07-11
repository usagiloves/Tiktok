# 🔍 Module Reconcile (Đối soát)

## 📖 Tổng quan
Module `reconcile` (Đối soát) đóng vai trò là Lưới an toàn (Safety Net) của hệ thống. Trong một thế giới lý tưởng, Webhook hoạt động 100%. Tuy nhiên thực tế, Webhook có thể bị drop do mất kết nối, server bảo trì, hoặc lỗi từ chính TikTok/Shopee. Module này liên tục quét API để chắp vá các lỗ hổng dữ liệu đó.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `reconcile.service.ts`
- **Chức năng**: Cung cấp các hàm công cụ mạnh mẽ để quét API và ép đồng bộ (Force Sync).
- **Hàm `reconcileOrders(shopId, from, to)`**: Quét toàn bộ danh sách đơn hàng đã thay đổi trạng thái trong khoảng thời gian `[from, to]`. Bắt buộc gửi lại vào Sync Engine.
- **Hàm `reconcileReturns(shopId, from, to)`**: Quét tương tự cho các yêu cầu Trả hàng / Hoàn tiền.
- **Lưu ý**: Hàm này được thiết kế để chia nhỏ mốc thời gian (Chunking) nhằm tránh vi phạm Rate Limit của TikTok/Shopee khi kéo dữ liệu quá lớn.

### 2. `reconcile.scheduler.ts`
- **Chức năng**: Chạy ngầm định kỳ (Cron Jobs).
- **Hàm `nearRealtimeSync()`**: Chạy 10 phút/lần. Quét các đơn bị thay đổi trong 1 giờ qua.
- **Hàm `dailyBackfill()`**: Chạy lúc 2h sáng mỗi ngày. Quét lùi lại 3 ngày để vớt các đơn "ngủ quên".
- **Hàm `deepBackfill()`**: Hỗ trợ quét lùi 15 ngày đối với các shop mới tích hợp lần đầu tiên.

## 🔄 Luồng hoạt động (Data Flow)
1. Scheduler kích hoạt theo giờ định trước.
2. Gọi `reconcile.service.ts` với `from` và `to` timestamp.
3. Kéo dữ liệu từ `TikTokApiClient` hoặc `ShopeeApiClient`.
4. Nếu dữ liệu có thay đổi so với DB nội bộ => Đưa vào `syncQueue` xử lý.

## ⚠️ Lưu ý quan trọng
- Khi tích hợp 1 Shop mới toanh vào hệ thống, dữ liệu quá khứ không có. Lập trình viên PHẢI trigger thủ công hàm `reconcileOrders` (quét lùi 30 ngày) thông qua `admin.controller` để Backfill dữ liệu cũ trước khi mở chốt cho Webhook hoạt động.
