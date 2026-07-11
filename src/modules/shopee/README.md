# 🛍️ Module Shopee (Giao tiếp API Nền tảng)

## 📖 Tổng quan
Module `shopee` đóng vai trò là "Thông dịch viên" giữa hệ thống và Shopee Open API v2. Nó xử lý luồng Webhook (Push notifications) và thực hiện các lời gọi API để truy vấn dữ liệu chi tiết.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `shopee-api.client.ts`
- **Chức năng**: Lớp bao bọc (Wrapper) các API của Shopee.
- **Cơ chế Xác thực (Auth)**: API Shopee v2 yêu cầu một thuật toán mã hóa chữ ký (Signature) cực kỳ phức tạp dựa trên `partner_id`, `api_path`, `timestamp`, `access_token` và `shop_id`. File này xử lý ngầm toàn bộ logic đó.
- **Các hàm cốt lõi**:
  - `getOrderDetail`: Truy vấn chi tiết thông tin Đơn hàng.
  - `getReturnDetail`: Truy vấn thông tin luồng Trả hàng/Hoàn tiền.

### 2. `shopee-oauth.controller.ts` & `shopee-token.service.ts`
- **Chức năng**: Quản lý vòng đời cấp quyền Cửa hàng (Shop).
- **Luồng hoạt động**:
  1. Frontend gọi `/shopee/oauth/authorize`. Trả về URL đăng nhập Shopee Open Platform.
  2. Shop chủ động cấp quyền. Shopee đẩy `code` về `/shopee/oauth/callback`.
  3. Dùng `code` lấy `access_token` và lưu vào Database.
  4. Hệ thống sẽ tự động làm mới Token định kỳ để không bao giờ bị hết hạn.

## 🔄 Luồng hoạt động (Data Flow)
1. Cơ chế tương tự TikTok. Khác biệt lớn nhất nằm ở thuật toán Sinh chữ ký (Sign) cho mỗi Request API.

## ⚠️ Lưu ý quan trọng
- Khác với TikTok, cấu trúc JSON trả về của Shopee có một vài điểm đặc thù (như Unix Timestamp là mili-giây hoặc giây tùy hàm). Khi xử lý, bộ Normalizer phải luôn ép kiểu chuẩn tắc để tránh lệch múi giờ trên Lark.
- Shopee Open API v2 nghiêm ngặt hơn về Rate Limit. Các lời gọi API bắt buộc phải sử dụng chunking (gom nhóm max 50 đơn/lần).
