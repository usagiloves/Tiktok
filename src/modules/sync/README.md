# 🛠️ Module Sync (Động cơ Đồng bộ)

## 📖 Tổng quan
Module `sync` là trái tim của toàn bộ hệ thống. Nó chịu trách nhiệm nhận dữ liệu thô từ các nền tảng (TikTok, Shopee), chuẩn hóa chúng, xếp hàng đợi (Queue), và đồng bộ lên Lark Base.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `normalizer.service.ts` (Lớp Chống Tham Nhũng - Anti-Corruption Layer)
- **Chức năng**: Dịch payload lộn xộn của TikTok/Shopee thành định dạng nội bộ `NormalizedRequest`.
- **Hàm `normalizeOrder(platform, rawData)`**: Trích xuất `orderId`, `status`, `buyer_name`, tính toán giá trị đơn, dịch trạng thái sang ngôn ngữ chung.
- **Hàm `normalizeReturn(platform, rawData)`**: Trích xuất `returnId`, `return_reason`, `return_status` cho các luồng Hoàn trả.
- **Lưu ý**: Bất cứ khi nào TikTok/Shopee thay đổi cấu trúc JSON (đổi tên trường), **chỉ cần sửa duy nhất tại file này**.

### 2. `status-mapper.service.ts`
- **Chức năng**: Từ điển ánh xạ trạng thái.
- **Hàm `mapOrderStatus(rawStatus)`**: Dịch `AWAITING_SHIPMENT` -> `Chờ lấy hàng`, `IN_TRANSIT` -> `Đang giao`.
- **Hàm `mapReturnStatus(rawStatus)`**: Dịch `RETURN_IN_TRANSIT` -> `Đang hoàn`.
- **Lưu ý**: Nếu bảng Lark thay đổi Dropdown Trạng thái, phải vào đây để sửa chuỗi ánh xạ tương ứng.

### 3. `sync-engine.service.ts`
- **Chức năng**: Nhận lệnh đồng bộ, xây dựng chuỗi Payload chuẩn xác để chuẩn bị bắn lên Lark.
- **Hàm `upsertLarkRecord(normalizedData)`**: Tìm kiếm xem đơn hàng đã có `record_id` chưa. Tiến hành POST (Tạo mới) hoặc PATCH (Cập nhật).
- **Lưu ý ĐẶC BIỆT**: Cơ chế **Preserve User Data**. Hàm này sẽ so sánh dữ liệu mới từ nền tảng với dữ liệu cũ trên Lark. Nó **tuyệt đối không ghi đè** các cột do nhân sự CSKH tự nhập (như Ghi chú, Người phụ trách).

### 4. `sync-worker.ts`
- **Chức năng**: Consumer (Công nhân) xử lý hàng đợi từ BullMQ.
- **Hàm `process(job)`**: Rút từng Job ra, gọi `sync-engine` để cập nhật Lark, xử lý cơ chế Retry tự động nếu API Lark bị lỗi quá tải (Rate limit).

## 🔄 Luồng hoạt động (Data Flow)
1. Dữ liệu thô từ Webhook/Cronjob được ném vào `normalizer.service.ts`.
2. Dữ liệu sau khi chuẩn hóa được đẩy vào `Sync Queue` (BullMQ).
3. `sync-worker.ts` bắt lấy Job, gọi `sync-engine.service.ts`.
4. `sync-engine` gọi `lark-api.client.ts` để cập nhật bảng Lark.
5. Nếu lỗi, Worker tự động đánh dấu Failed và Retry lại sau 1 phút.
