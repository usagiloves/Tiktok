# 🚚 Module Failed Delivery (Giao Hàng Thất Bại)

## 📖 Tổng quan
Đây là module cốt lõi giải quyết bài toán hóc búa của hệ thống: Chống thất thoát hàng hóa hoàn trả do giao thất bại. Nó lách qua điểm mù của API nền tảng (treo trạng thái `CANCELLED` vô thời hạn) bằng cách phân tích bộ lọc sâu.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `failed-delivery.service.ts`
- **Chức năng**: Dò tìm và định danh chính xác đâu là đơn bị Giao hàng thất bại.
- **Hàm `identifyFailedDelivery(orderPayload)`**: 
  Thực hiện lọc qua 2 phễu cực kỳ nghiêm ngặt:
  1. Kiểm tra `cancellation_initiator` (Chỉ chấp nhận `SYSTEM` hoặc `LOGISTICS`. Loại trừ tuyệt đối `BUYER` và `SELLER`).
  2. Kiểm tra `cancel_reason` (Bắt các từ khóa như `Giao gói hàng thất bại`, `DELIVERY`, `LOGISTICS`).
- **Hàm `processWarehouseStatus(failedOrder)`**: Xác định trạng thái của kiện hàng:
  - Nếu `warehouseReceivedAt` = `null` => Trạng thái **Đang hoàn**.
  - Nếu `warehouseReceivedAt` có giá trị => Trạng thái **Cần kiểm tra**.

### 2. `failed-delivery.scheduler.ts`
- **Chức năng**: Chạy ngầm tự động để chốt các đơn Giao hàng thất bại bị treo.
- **Hàm `checkPendingReturns()`**: Mỗi đêm sẽ quét các đơn **Đang hoàn** quá 14 ngày mà chưa có `Ngày về kho`, báo cáo cảnh báo qua Lark Bot để nhân sự vận hành vào làm việc với J&T Express.

## 🔄 Luồng hoạt động (Data Flow)
1. Khi `Reconcile Module` hoặc `Webhook` kéo đơn hàng về có status là `CANCELLED`, dữ liệu lập tức được pass qua `failed-delivery.service.ts`.
2. Hàm `identify` chạy. Nếu là False => Bỏ qua (Đơn khách tự hủy). Nếu là True => Dán nhãn `_is_failed_delivery: true`.
3. Bẻ lái (Intercept) trạng thái: Thay vì đẩy chữ "Đã hủy" lên Lark, module này ép trạng thái thành **Đang hoàn** hoặc **Cần kiểm tra** tùy theo dữ liệu đối soát kho.

## ⚠️ Lưu ý quan trọng
- TikTok và Shopee thường xuyên thay đổi chuỗi text `cancel_reason`. Khi thấy báo cáo sót đơn trên Lark, lập trình viên cần vào file `service` để bổ sung thêm từ khóa (Keyword) vào phễu lọc.
