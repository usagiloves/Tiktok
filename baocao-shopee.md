# BÁO CÁO NÂNG CẤP HỆ THỐNG: MÔ-ĐUN KIỂM SOÁT ĐƠN GIAO THẤT BẠI SHOPEE
*(Tài liệu mở rộng Kiến trúc theo dõi & Đối soát Đơn Shopee)*

---

## 1. BỐI CẢNH (SHOPEE INTEGRATION)
Tiếp nối thành công của hệ thống theo dõi đơn TikTok, nền tảng Shopee cũng đối diện với nguy cơ mất dấu các "Đơn Giao Hàng Thất Bại" (Failed Delivery). 
Mặc dù API Shopee có phần ổn định hơn, nhưng trong nhiều trường hợp, trạng thái kiện hàng đang hoàn về vẫn đứng yên ở `CANCELLED` mà không cập nhật rõ ràng trạng thái `RETURNING` hay webhook báo về kho. 
Dựa trên kiến trúc "Watchlist khép kín" đã xây dựng, hệ thống quyết định **Mở rộng năng lực của Radar** để bao trùm luôn cả nền tảng Shopee.

---

## 2. PHƯƠNG ÁN MỞ RỘNG (SCALING THE ARCHITECTURE)
Thay vì tạo thêm một Module cồng kềnh mới, chúng ta tái sử dụng toàn bộ khung sườn của `FailedDeliveryModule` hiện tại. 

Các nguyên tắc không đổi:
- **Watchlist chung:** Bảng `normalized_requests` tiếp nhận thêm các đơn Shopee có cờ `_is_failed_delivery` và trạng thái `Đang hoàn`.
- **Hội tụ Queue:** Xử lý xong thì ném chung vào `SYNC_ORDER` Queue để Worker phân phối.

Điểm Tối ưu dành riêng cho Shopee (Shopee Optimization):
- API của TikTok chỉ cho phép truy vấn từng đơn một (`order_id`).
- API của Shopee (`get_order_detail`) cho phép **truy vấn hàng loạt lên đến 50 đơn hàng cùng lúc** (Batch Fetching via `order_sn_list`).
- Do đó, Radar được tinh chỉnh để "đóng gói" các đơn Shopee thành từng cục (Chunk) 50 đơn trước khi gọi API, giúp tốc độ quét của Shopee nhanh gấp 50 lần so với TikTok.

---

## 3. CHI TIẾT TRIỂN KHAI CODE (IMPLEMENTATION DETAILS)

Đã tiến hành cập nhật trực tiếp vào hệ thống hiện tại:

### 3.1. Cập nhật `failed-delivery.module.ts`
- Import thêm `ShopeeModule` để Inject `ShopeeApiClient` vào Radar.

### 3.2. Cập nhật `failed-delivery.service.ts`
1. **Mở rộng Query:** 
   Bộ lọc Watchlist giờ đây bao gồm `platform: { in: ['TIKTOK', 'SHOPEE'] }`.
2. **Logic Phân luồng:**
   Tách danh sách pending thành `tiktokRequests` và `shopeeRequests`.
3. **Logic Chunking (Gộp đơn Shopee):**
   - Nhóm các đơn Shopee theo từng Shop (`shopId`).
   - Cắt danh sách thành từng gói 50 `order_sn`.
   - Bắn 1 request duy nhất cho 50 đơn qua hàm `shopeeApi.getOrderDetail()`.
4. **Logic Chốt sổ (Shopee Soft Cut):**
   - Lặp qua response của Shopee. Nếu đơn nào lẳng lặng chuyển trạng thái `status = COMPLETED`, lấy `update_time` của Shopee làm Ngày về kho.
   - Ném vào BullMQ Queue chung (`SYNC_ORDER`) với cờ `isFailedDelivery: true` và `warehouseReceivedAtMs`. (Sử dụng chung Worker đã được độ lại).

---

## 4. KẾT LUẬN
Nhờ thiết kế kiến trúc chuẩn mực và quy hoạch rõ ràng từ đầu (Tách biệt Watchlist DB và Hàng đợi Queue), việc thêm một nền tảng mới như Shopee vào hệ thống theo dõi ngầm tốn chưa đến **50 dòng code**. 
Tốc độ quét của Shopee được tối ưu tối đa nhờ cơ chế Batch Fetching (50 đơn/lần). Hiện tại, hệ thống đã sở hữu một "Rada kép" theo dõi sát sao sự im lặng của cả 2 nền tảng thương mại điện tử lớn nhất.

*Hoàn tất báo cáo mở rộng Shopee.*
