# TikTok Shop → Lark Base Automation

Hệ thống tự động đồng bộ dữ liệu đơn hàng, hoàn trả, hủy đơn, và khiếu nại từ TikTok Shop vào bảng quản lý CSKH trên Lark Base.

## Tính Năng Chính

- **Đồng bộ tự động**: Kéo dữ liệu đơn hàng mới và trạng thái đơn thay đổi liên tục.
- **Webhook realtime**: Lắng nghe và cập nhật ngay khi trạng thái đơn (Order) hoặc yêu cầu hoàn/trả (Return/Refund) thay đổi.
- **Cron đối soát**: Có 4 lịch đối soát tự động chạy ngầm (10 phút, 30 phút, hàng ngày, hàng tuần) để đảm bảo không bị miss dữ liệu nếu webhook lỗi.
- **Bảo vệ dữ liệu**: Chỉ cập nhật các cột hệ thống. Các cột do team CSKH nhập tay (ví dụ: Người phụ trách, Ghi chú CSKH, Kết quả xử lý nội bộ) sẽ được giữ nguyên không bị ghi đè.
- **Cảnh báo lỗi**: Tự động bắn thông báo lỗi qua Lark Bot nếu quá trình sync bị lỗi nhiều lần.
- **Admin Dashboard**: Cung cấp các API thủ công để admin có thể retry đơn lỗi hoặc đối soát lại (reconcile) theo khoảng ngày.

---

## Cấu Trúc Hệ Thống (Tech Stack)

- **Backend Framework**: [NestJS](https://nestjs.com/) (Node.js + TypeScript)
- **Database**: PostgreSQL
- **Queue/Worker**: Redis + [BullMQ](https://docs.bullmq.io/)
- **ORM**: [Prisma v7](https://www.prisma.io/)
- **Deployment**: Docker + Docker Compose

---

## Yêu Cầu Cài Đặt (Prerequisites)

1. [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS v18 hoặc v20)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Hoặc cài sẵn PostgreSQL và Redis riêng biệt)
3. Cài đặt biến môi trường toàn cầu (Tùy chọn: `npm i -g @nestjs/cli prisma`)

---

## Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Cài đặt thư viện
Mở terminal tại thư mục gốc của project:
```bash
npm install
```

### Bước 2: Khởi động Database (PostgreSQL + Redis)
Nếu bạn đã cài Docker Desktop, chạy lệnh sau để khởi tạo database:
```bash
docker compose up -d
```
*(Nếu bạn không dùng Docker, vui lòng cài PostgreSQL và Redis thủ công và đổi URI trong file `.env`)*

### Bước 3: Cấu hình biến môi trường
File `.env` đã được cấu hình mặc định sẵn để kết nối local DB. 
Tuy nhiên, để test thực tế bạn cần thay các giá trị của **TikTok** và **Lark** bằng API key thật:
- `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`
- `LARK_APP_ID`, `LARK_APP_SECRET`, `LARK_BASE_APP_TOKEN`, `LARK_TABLE_ID_CSKH`

### Bước 4: Khởi tạo Database Schema (Migration)
Chạy lệnh Prisma để tạo các bảng trong PostgreSQL:
```bash
npx prisma migrate dev --name init
```

### Bước 5: Chạy Server
Khởi động hệ thống ở chế độ watch (hot-reload):
```bash
npm run start:dev
```
Server sẽ chạy ở địa chỉ `http://localhost:3000`

---

## Hướng Dẫn Test OAuth (Cấp quyền shop TikTok)

TikTok yêu cầu Callback URL (`TIKTOK_REDIRECT_URI`) phải là một đường dẫn public HTTPS. Để test local, bạn cần dùng **Ngrok**.

1. Cài đặt và chạy ngrok ở port 3000:
   ```bash
   ngrok http 3000
   ```
2. Copy URL của ngrok (ví dụ: `https://abcd.ngrok-free.app`).
3. Mở file `.env`, cập nhật biến môi trường:
   ```env
   TIKTOK_REDIRECT_URI=https://abcd.ngrok-free.app/tiktok/oauth/callback
   ```
4. Đăng nhập vào [TikTok Partner Center](https://partner.tiktokshop.com/), cài đặt App của bạn và cập nhật Redirect URL giống với URL ngrok ở trên.
5. Mở trình duyệt và truy cập vào link:
   ```text
   http://localhost:3000/tiktok/oauth/authorize
   ```
   Hệ thống sẽ dẫn bạn sang TikTok để cấp quyền, sau khi chấp nhận, thông tin Token sẽ được lưu tự động vào Database.

---

## Các API Endpoints Quan Trọng

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `GET`  | `/health` | Kiểm tra trạng thái server đang hoạt động |
| `GET`  | `/tiktok/oauth/authorize` | Lấy link cài đặt ủy quyền shop |
| `POST` | `/admin/sync/retry` | Retry đồng bộ lại 1 đơn bị lỗi qua `sync_key` |
| `POST` | `/admin/reconcile/orders` | Đối soát lại đơn hàng theo khoảng ngày `from`, `to` |
| `POST` | `/admin/reconcile/returns`| Đối soát lại hoàn/trả theo khoảng ngày `from`, `to` |
| `GET`  | `/admin/dashboard` | Dashboard thống kê đơn và lỗi trong ngày |

---

## Cấu trúc Database (6 bảng chính)

1. `shops`: Chứa danh sách các shop cần đồng bộ và thương hiệu (brand) tương ứng.
2. `tiktok_tokens`: Lưu access_token và refresh_token mã hóa (hệ thống tự auto-refresh).
3. `normalized_requests`: Dữ liệu thô TikTok đã được chuyển đổi thành chuẩn nội bộ (lưu cả đơn hàng, hoàn trả, khiếu nại).
4. `lark_records`: Bảng map khóa đồng bộ `sync_key` với `record_id` trên Lark, phục vụ quá trình cập nhật (upsert).
5. `sync_logs`: Lưu toàn bộ lịch sử (log) của quá trình tạo mới, cập nhật, skip hoặc lỗi.
6. `webhook_events`: Lưu lại payload raw của mọi webhook TikTok gửi sang để kiểm tra (audit) khi cần thiết.
