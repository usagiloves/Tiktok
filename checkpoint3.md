# Checkpoint 3 & Báo Cáo Công Việc

## 1. Mục Tiêu Khắc Phục Lỗi Thiếu Đơn Hàng Của Khách
- **Mục tiêu**: Lấy dữ liệu từ API của TikTok cho 2 mã đơn hàng bị thiếu (`584789657879021511` và `584865448695530667`) để tìm hiểu xem vì sao chúng không được đồng bộ về Lark.
- **Vấn đề đã gặp**: Gặp lỗi `Invalid credentials` liên tục khi gọi API lên TikTok.

## 2. Những Công Việc Đã Thực Hiện & Hoàn Thành
1. Sửa lỗi `Dependency Injection` (thiếu `TiktokModule`, `HttpModule`, và gọi sai `reconcileService`) khiến backend bị crash khi khởi động.
2. Sửa lại cấu trúc gọi TikTok API sang phiên bản mới nhất (v2) thông qua `TiktokApiClient` đã được cấu hình sẵn trong project thay vì gọi thủ công v1.
3. Fix lỗi token bị cache bằng cách chạy lệnh can thiệp thẳng vào database `tiktok_lark_sync`, ép hạn của token lùi về quá khứ để hệ thống tự động refresh và lấy token mới nhất từ TikTok.
4. Chạy tool deploy tự động (`node scripts/deploy.js`) nhiều lần để đẩy code mới lên VPS và khởi động lại container API thành công.
5. Fix lỗi cú pháp (Typo) `prisma.shops` thành `prisma.shop` khi build container.

## 3. Kết Quả Bất Ngờ (Nguyên nhân thực sự khiến đơn không đồng bộ)
Sau khi fix xong toàn bộ lỗi kết nối và lấy được token hợp lệ, tôi đã dùng tool test gọi lên API của TikTok để tra cứu 2 đơn hàng `584789657879021511` và `584865448695530667`. Kết quả TikTok trả về:
```json
{
  "error": "TikTok API error: code=21008111, message=The order/package does not belong to the current seller; detail:The order/package does not belong to the current seller"
}
```
**Ý nghĩa của lỗi này:** Hai mã đơn hàng này **KHÔNG THUỘC VỀ** tài khoản shop TikTok (cửa hàng) hiện đang được kết nối với hệ thống đồng bộ của chúng ta. (Có thể bạn đang nhầm lẫn lấy ID từ một Shop khác chưa được Authorize).

---

## 4. Business Rule Map Trạng Thái Đặc Thù Của Team
Dựa trên cấu hình trong `src/modules/sync/status-mapper.service.ts`, các trạng thái đang được map như sau:

**A. Đơn Hàng (Order Status):**
- `UNPAID` → Chưa thanh toán
- `ON_HOLD` → Đang giữ đơn
- `AWAITING_SHIPMENT` → Chờ xử lý vận chuyển
- `AWAITING_COLLECTION` → Chờ đơn vị vận chuyển lấy hàng
- `IN_TRANSIT` → Đang giao
- `DELIVERED` / `COMPLETED` → Đã giao *(Lưu ý: Không tự chuyển thành "Hoàn Tất", việc này để team kho tự xử lý)*
- `CANCELLED` → Đã hủy

**B. Hoàn/Trả (Return/Refund Status):**
- `RETURN_REQUESTED`, `SELLER_REVIEWING`, `BUYER_SHIPPED`, `RETURN_IN_TRANSIT`, `AWAITING_BUYER_SHIP`, `PENDING`, `PROCESSING`, `SHIPPED_BACK` → **Chưa về kho**
- `WAREHOUSE_RECEIVED`, `REFUND_SUCCESS`, `RETURN_OR_REFUND_REQUEST_COMPLETE`, `RECEIVED`, `APPROVED` → **Chưa làm hoàn** *(Lưu ý: Hệ thống không tự chuyển thành "Hoàn Tất")*
- `REQUEST_REJECTED`, `REJECTED` → **Từ chối**
- `CANCELLED` → Đã hủy

**C. Loại Yêu Cầu (Request Type):**
- `ORDER` → *(Bỏ trống)*
- `RETURN_AND_REFUND` → Đơn THHT
- `REFUND_ONLY` → Hoàn tiền
- `CANCELLED` → Đơn hủy

*(Lưu ý về requirement filter sắp tới: Khách hàng chỉ muốn quét các đơn **Hủy** hoặc **Giao không thành công** để điền vào cột Loại Yêu Cầu, và loại bỏ các trạng thái đang giao/đã giao ra khỏi logic Sync, tôi sẽ thiết kế filter ở bước tiếp theo)*

---

## 5. Tình Trạng Các Script Vận Hành (Scripts Folder)
- `scripts/deploy.js`: **ĐANG DÙNG (CHÍNH)** - Tự động upload code lên VPS bằng SSH/SCP, chạy build lại Docker Compose. Rất quan trọng cho vòng lặp CI/CD hiện tại.
- `scripts/test-vps.js`: **ĐANG DÙNG (TESTING)** - Script được thiết kế chuyên dụng để gọi `curl` đến endpoint API ẩn (ví dụ `/admin/test-order/`) trên localhost của VPS, và chạy lệnh `docker exec` can thiệp DB (như fake hạn Token).
- `scripts/check-order-vps.js` / `scripts/check-order.js`: **BỎ QUA / KHÔNG CẦN THIẾT** - Trước đó đã thử upload lên VPS để gọi bash nhưng không thành công do thiếu NodeJS environment và jq packages trên VPS.
- `scripts/force-update-returns.js` / `scripts/verify-new-table.js`: **LƯU TRỮ LỊCH SỬ** - Đây là các file script một lần (one-off) được dùng để apply/migrate DB hoặc update dữ liệu hàng loạt trong quá khứ, hiện tại không chạy trong quy trình deploy tự nhiên nữa.

---

## 6. Các Edge Case TikTok Token & Status Đang Gặp Phải (Production)
1. **Lỗi `Invalid credentials` ảo:** Token lưu trong cơ sở dữ liệu `tiktok_tokens` vẫn báo còn hạn (dựa trên `access_token_expired_at`), nhưng TikTok đã thu hồi hoặc thay đổi chính sách ở backend của họ khiến token đó không dùng được. Giải pháp là phải có fallback ép tự động refresh token kể cả khi DB báo còn hạn, hoặc chạy `test-vps.js` để trừ bớt hạn trong DB.
2. **Khác biệt Endpoint v1 và v2:** TikTok có 2 phiên bản API. V1 bắt dùng Header `x-tts-access-token`, v2 bắt dùng query params hoặc format header kiểu mới. Do đó `TiktokApiClient` nội bộ (chuẩn bị sẵn cho v2) phải được ưu tiên tuyệt đối, tuyệt đối không tự viết lại logic gọi URL `https://open-api.tiktokglobalshop.com` raw.
3. **Đơn hàng "Bóng Ma" (Phantom Orders):** Như 2 mã đơn `58478965...` báo lỗi "Does not belong to current seller". Điều này xảy ra khi có 1 ID đơn hợp lệ, nhưng Access Token hiện tại thuộc về Shop A, còn đơn lại của Shop B. Hệ thống trả về `Invalid Credentials` hoặc `Does not belong to seller` gây nhầm lẫn là do token hỏng, nhưng thực chất là sai nguồn gốc shop.
4. **Rate Limit TikTok:** TikTok có cơ chế giới hạn request. API Wrapper `callApi` đã được tôi đảm bảo có logic retry với Exponential Backoff (nhân đôi thời gian chờ mỗi lần thử lại) để tránh dội bom API và bị khóa vĩnh viễn.

---

## 7. Lịch Sử Các Lần Sửa Lỗi Gần Nhất
1. **Lỗi Dependency `AdminModule`:** Bổ sung `TiktokModule`, `HttpModule` vào file `admin.module.ts` vì Controller cần gọi `TiktokApiClient`.
2. **Sửa tham chiếu Prisma Model:** Tên model trong Prisma là `Shop` nhưng code gọi nhầm thành `this.prisma.shops`. Đã fix thành `this.prisma.shop`.
3. **Fix Constructor AdminController:** Trong quá trình tích hợp `TiktokApiClient`, đã vô tình ghi đè làm mất `ReconcileService` trong constructor khiến TypeScript quăng lỗi. Đã bổ sung lại đầy đủ các DI.
4. **Routing Issue:** Đã xác định rõ NestJS hiện tại KHÔNG cấu hình Global Prefix `/api` trong `main.ts` cho các API chung, nên đường dẫn đúng của endpoint test phải là `http://localhost:3000/admin/test-order/:id` chứ không có `/api/`.
