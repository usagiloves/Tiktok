# 🎵 Module TikTok (Giao tiếp API Nền tảng)

## 📖 Tổng quan
Module `tiktok` quản lý toàn bộ giao thức kết nối 2 chiều giữa hệ thống và TikTok Shop API. Bao gồm: Ủy quyền (OAuth), tự động gia hạn Token (Auto-Refresh), nhận Push Webhook và gọi API truy vấn dữ liệu thô.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `tiktok-api.client.ts`
- **Chức năng**: Lớp bao bọc (Wrapper) các API của TikTok.
- **Cơ chế**: Tự động tính toán Chữ ký điện tử (Signature) dựa trên `app_secret` và Unix Timestamp để xác thực. Tự động Retry nếu bị trả về mã 429 (Too many requests).
- **Các hàm cốt lõi**:
  - `getOrderDetail`: Truy vấn chi tiết Đơn hàng (Bao gồm Giá, Người mua, Mã vận đơn).
  - `getReverseOrder`: Truy vấn chi tiết luồng Hoàn trả (Lý do, Trạng thái, Bằng chứng).

### 2. `tiktok-oauth.controller.ts` & `tiktok-token.service.ts`
- **Chức năng**: Quản lý vòng đời của Cửa hàng (Shop).
- **Luồng hoạt động**:
  1. Frontend gọi `/tiktok/oauth/authorize`. Trả về URL đăng nhập TikTok Seller.
  2. Shop chủ động cấp quyền. TikTok đẩy `auth_code` về `oauth/callback`.
  3. Đổi `auth_code` lấy `access_token` và `cipher`. Lưu vào Database `Shop` và `TiktokToken`.
  4. Cronjob định kỳ 24h/lần gọi TikTok để làm mới (refresh) token tự động.

### 3. `tiktok-webhook.controller.ts`
- **Chức năng**: Endpoint public `POST /api/webhook/tiktok` đăng ký với TikTok để nhận thông báo realtime (Push events).
- **Cơ chế xác thực**: Dò Header `Authorization` và so sánh HMAC SHA256 Signature đảm bảo Webhook thực sự đến từ TikTok.
- **Hàm `handleWebhook()`**: Lưu raw payload xuống bảng `webhook_events`, sau đó bóc tách dữ liệu và ném cho `Sync Queue`.

## 🔄 Luồng hoạt động (Data Flow)
1. Webhook TikTok bắn JSON về Controller.
2. Xác minh Signature. 
3. Controller ném ID vào Hàng đợi. 
4. Worker bóc ID, dùng `tiktok-api.client.ts` để gọi API ngược lại TikTok nhằm lấy dữ liệu đầy đủ, toàn vẹn nhất (Tránh tin tặc giả mạo payload).

## ⚠️ Lưu ý quan trọng
- TikTok sử dụng `shop_cipher` (Chuỗi định danh bảo mật dài) để định danh shop trên API v2. Hãy lưu ý tham số này thay vì dùng `shop_id` thông thường.
