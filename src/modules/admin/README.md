# 🛠️ Module Admin (Quản trị Hệ thống)

## 📖 Tổng quan
Module `admin` cung cấp các API (Endpoints) đặc quyền để thao tác, can thiệp thủ công vào hệ thống. Nó giống như một "Bảng điều khiển" (Control Panel) dành riêng cho Backend Developer hoặc Tech Lead khi cần gỡ rối (Debug) hoặc ép hệ thống chạy theo ý muốn.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `admin.controller.ts`
Chứa tất cả các Endpoints:
- **`POST /admin/sync/retry`**: Cho phép truyền vào 1 mã Đơn hàng (hoặc `sync_key`). Hệ thống sẽ bỏ qua mọi bộ đếm thời gian, ngay lập tức kéo dữ liệu mới nhất từ nền tảng và bắn lại lên Lark. Rất hữu ích khi cần Fix nhanh 1 đơn bị kẹt.
- **`POST /admin/reconcile/orders`**: Kích hoạt bộ quét lịch sử bằng tay. Truyền vào `shopId`, `from`, `to` (thời gian). Module sẽ gọi sang `reconcile` để kéo một lượng lớn dữ liệu về (Backfill). Dùng khi mới thêm 1 Cửa hàng mới vào hệ thống.
- **`GET /admin/dashboard`**: Trả về số liệu thống kê (Số đơn thành công, số lỗi) trong ngày để hiển thị lên UI hoặc Monitoring.

## 🔄 Luồng hoạt động (Data Flow)
Khi Admin gọi API -> Controller tiếp nhận lệnh -> Gọi sang các Module nghiệp vụ tương ứng (`reconcile.service`, `sync-engine.service`) để kích hoạt chức năng, thay vì phải chờ Cronjob chạy.

## ⚠️ Lưu ý quan trọng
- Không public module này ra bên ngoài mạng nội bộ. Các API này đều là các lệnh gây tốn kém tài nguyên (Heavy requests), nếu bị lạm dụng có thể làm cạn kiệt Token (Rate limit) của ứng dụng trên TikTok/Shopee.
