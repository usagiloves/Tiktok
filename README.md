# 🚀 E-Commerce to Lark Base Automation System (TikTok & Shopee)

Hệ thống đồng bộ dữ liệu tập trung (Data Synchronization Hub) tự động hóa luồng nghiệp vụ Đơn hàng, Trả hàng/Hoàn tiền, và Giao hàng thất bại từ các sàn Thương mại điện tử (TikTok Shop, Shopee) về bảng quản lý chăm sóc khách hàng (CSKH) trên Lark Base.

Tài liệu này cung cấp cái nhìn toàn cảnh và chi tiết về cấu trúc hệ thống, luồng dữ liệu, và các module nghiệp vụ phức tạp để hỗ trợ các kỹ sư phát triển và vận hành hệ thống trong tương lai.

---

## 🏗️ 1. Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo tư tưởng **Clean Architecture** kết hợp với mô hình **Event-Driven** và **Anti-Corruption Layer (Lớp chống tham nhũng dữ liệu)** để đảm bảo tính mở rộng và độc lập với các thay đổi từ API của bên thứ 3 (TikTok/Shopee).

### Tech Stack Khung:
- **Core Framework**: NestJS (Node.js + TypeScript).
- **Database**: PostgreSQL (Primary Data Store) + Prisma ORM.
- **Message Broker / Queue**: Redis + BullMQ.
- **Deployment**: Docker & Docker Compose.

### Các Lớp Kiến trúc (Layers):
1. **Platform Gateway (Cửa ngõ Sàn TMĐT)**: Nơi tiếp nhận Webhook và giao tiếp API (TiktokModule, ShopeeModule).
2. **Anti-Corruption Layer (Lớp chuẩn hóa - Normalizer)**: Dịch toàn bộ dữ liệu thô (Raw Payload) phức tạp từ các sàn thành 1 định dạng chuẩn duy nhất (`NormalizedRequest`) của hệ thống. Nhờ lớp này, nếu TikTok/Shopee thay đổi API, chúng ta chỉ cần sửa ở hàm Map, toàn bộ hệ thống lõi không bị ảnh hưởng.
3. **Core Sync Engine (Động cơ đồng bộ)**: Nhận dữ liệu chuẩn hóa, đưa vào Hàng đợi (Queue) để điều tiết tốc độ, tránh Rate Limit, và so khớp/cập nhật lên Lark Base.
4. **Integration Layer (Lớp tích hợp đích)**: Giao tiếp trực tiếp với Lark Open API (LarkModule) và J&T API (JtExpressModule).

---

## 🧩 2. Chức năng Chi tiết của Các Module Chuyển Sâu

Hệ thống được chia thành nhiều module độc lập, chịu trách nhiệm cho từng vòng đời của dữ liệu.

### 2.1. Module Nền tảng (TikTok / Shopee Modules)
- **Quản lý Token**: Tự động mã hóa (Encrypt), lưu trữ và Auto-Refresh Token nền tảng trước khi hết hạn. Cảnh báo qua Lark Bot nếu Token bị thu hồi (Revoked).
- **Webhook Listener**: Lắng nghe Realtime các sự kiện `ORDER_STATUS_CHANGE`, `RETURN_STATUS_CHANGE`. Lưu toàn bộ payload raw vào bảng `webhook_events` để Audit/Debug.
- **API Client**: Cung cấp các wrapper gọi API với cơ chế Retry tự động khi gặp lỗi mạng hoặc Rate Limit (HTTP 429).

### 2.2. Sync Engine (Động cơ Đồng bộ)
Đây là trái tim của hệ thống, sử dụng **BullMQ** để xử lý bất đồng bộ.
- **Chống Trôi Dữ Liệu (Deduplication)**: Sử dụng Job ID dán nhãn (`TIKTOK_[ShopID]_[OrderID]_[Type]`) để đảm bảo dù Webhook bắn về 10 lần trong 1 giây, hệ thống chỉ xử lý 1 lần.
- **Cơ chế Update Thông minh (Upsert)**: 
  - Nếu Đơn hàng chưa có trên Lark: Tạo bản ghi (Record) mới.
  - Nếu Đơn hàng đã tồn tại: Cập nhật dữ liệu. **ĐẶC BIỆT LƯU Ý:** Hệ thống chỉ cập nhật các trường Hệ thống (System Fields như Trạng thái, Giá tiền...). Các trường do nhân sự CSKH nhập thủ công (Ghi chú, Kết quả xử lý, Người phụ trách) được bảo vệ tuyệt đối (Preserved) để không bị ghi đè.
- **Bảng Ánh Xạ `lark_records`**: Liên kết 1-1 giữa ID Đơn hàng trên Sàn và `record_id` trên Lark Base giúp tốc độ cập nhật đạt mức siêu tốc (O(1)).

### 2.3. Trái Tim Nghiệp Vụ: Failed Delivery Module (Giao hàng thất bại)
Đây là module phức tạp và giá trị nhất hệ thống nhằm giải quyết điểm mù của TikTok API (TikTok không cung cấp trạng thái hoàn thành cho đơn giao thất bại mà treo mãi ở `CANCELLED`).
- **Phễu lọc Nhận Diện (4 Lớp)**:
  1. Status gốc phải là `CANCELLED`.
  2. `Cancel Initiator` (Người hủy) phải là `LOGISTICS` hoặc `SYSTEM` (Tuyệt đối loại trừ người mua/người bán hủy).
  3. `Cancel Reason` (Lý do hủy) phải chứa các từ khóa đặc thù như: `Giao gói hàng thất bại`, `Delivery failed`.
- **Logic Trạng Thái (Warehouse Logic)**:
  - Dựa vào kết nối với đơn vị vận chuyển (hoặc fallback bằng `update_time` của nền tảng), nếu kiện hàng chưa về kho (`warehouseReceivedAt = null`), hệ thống gán trạng thái trên Lark là **Đang hoàn**.
  - Ngay khi kiện hàng về tới kho, hệ thống tự động búng trạng thái sang **Cần kiểm tra**. Giúp chống thất thoát hàng hóa hoàn trả một cách triệt để.

### 2.4. Reconcile Module (Đối soát Tự Động)
Webhook có thể bị rớt do mạng, server sập, hoặc nền tảng không bắn. Do đó, hệ thống trang bị lớp bảo vệ thứ 2 là các Cronjob Đối soát:
- **Near-Realtime Cron (Mỗi 10 phút / 30 phút)**: Quét API lấy các đơn có sự thay đổi trong 1 giờ qua để lấp đầy lỗ hổng nếu webhook xịt.
- **Daily Reconcile (Hàng ngày)**: Quét lùi lại 3-5 ngày để đảm bảo các đơn hàng "ngủ quên" được cập nhật.
- **Deep Backfill (Kéo dữ liệu lịch sử)**: Hỗ trợ quét lùi 15-30 ngày đối với các Shop mới kết nối (Ví dụ: CWELL, GOODFIT).

### 2.5. Report & Admin Module
- **Summary Bot**: Mỗi ngày tự động tổng hợp báo cáo (Số lượng Đơn hàng/Hoàn trả đã đồng bộ thành công, Số lượng lỗi) và bắn tin nhắn vào Group Chat của team trên Lark.
- **Alerting**: Bất kỳ lỗi gián đoạn nào (Invalid Token, Rate Limit, Schema Lark bị đổi) đều kích hoạt Alert gửi cho Admin xử lý tức thời.

---

## 🔄 3. Luồng Dữ Liệu Chi Tiết (Data Flows)

### A. Luồng Đơn hàng (Order Flow)
1. **Trigger**: Khách đặt hàng / Đơn vị VC lấy hàng -> TikTok/Shopee bắn Webhook `ORDER_STATUS_CHANGE`.
2. **Gateway**: `WebhookController` tiếp nhận, lưu Raw vào `webhook_events`, ném Data vào `WebhookWorker`.
3. **Normalize**: Đọc Shop Cipher, gọi lại API lấy chi tiết đơn (nếu Payload Webhook thiếu), chuẩn hóa thành `NormalizedRequest`.
4. **Queue**: Bắn vào `SyncQueue`.
5. **Worker**: Đọc `NormalizedRequest`, truy vấn `lark_records` xem có `record_id` chưa.
6. **Lark API**: 
   - Có `record_id`: Gọi `PATCH` update các cột quy định.
   - Không có `record_id`: Gọi `POST` tạo record mới, lưu lại `record_id` vào Database.

### B. Luồng Trả Hàng (Return Flow)
Tương tự Order Flow, nhưng Normalizer sẽ trích xuất thêm các trường: Mã hoàn trả, Lý do hoàn, Hình ảnh bằng chứng, Trạng thái Hoàn (Approved, Rejected, Pending). Nếu đơn hàng là Giao hàng thất bại, luồng sẽ bị bẻ lái sang Failed Delivery Module trước khi lên Lark.

---

## 🗄️ 4. Sơ đồ Database (Database Schema)

Hệ thống dùng 6 bảng chính (Primary Tables):

1. **`Shop`**: Quản lý danh sách các cửa hàng (CWELL, GOODFIT...). Lưu `shopId`, `brand`, Trạng thái Active.
2. **`TiktokToken` / `ShopeeToken`**: Lưu trữ Token bảo mật.
3. **`WebhookEvent`**: Thùng chứa (Sink) log mọi Request từ nền tảng. Rất hữu ích khi cần debug lỗi 1 đơn hàng cụ thể trong quá khứ.
4. **`NormalizedRequest`**: Kho chứa dữ liệu trung tâm. Mọi thay đổi trạng thái của Đơn/Hoàn đều lưu dưới dạng JSONB. Bảng này đóng vai trò như một Single Source of Truth nội bộ.
5. **`LarkRecord`**: Bảng Map. `[platform] + [shopId] + [orderId]` -> `[larkRecordId]`. Đảm bảo hệ thống không tạo trùng (Duplicate) đơn hàng trên Lark.
6. **`SyncLog`**: Lưu lịch sử đồng bộ. Ai đồng bộ? Khi nào? Thành công hay Thất bại? Lý do thất bại (Lỗi API Lark, Thiếu cột...)?

---

## ⚙️ 5. Hướng Dẫn Cài Đặt (Installation & Setup)

### Yêu Cầu Môi Trường
- Node.js (v18+ LTS)
- PostgreSQL (v14+)
- Redis (v6+)
- Docker (Tùy chọn nếu chạy Production)

### Các Bước Triển Khai Local

1. **Clone & Cài Thư viện**
   ```bash
   git clone <repo_url>
   cd tiktok
   npm install
   ```

2. **Khởi tạo Database & Redis**
   Chạy Docker Compose (Đã bao gồm cấu hình Postgres & Redis):
   ```bash
   docker compose up -d
   ```

3. **Cấu hình Môi trường (.env)**
   Copy file `.env.example` thành `.env` và điền các Key:
   ```env
   # Database & Redis
   DATABASE_URL="postgresql://user:pass@localhost:5432/tiktok_sync"
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # TikTok API
   TIKTOK_APP_KEY="your_key"
   TIKTOK_APP_SECRET="your_secret"
   TIKTOK_REDIRECT_URI="https://your-ngrok.app/tiktok/oauth/callback"

   # Lark API
   LARK_APP_ID="cli_xxx"
   LARK_APP_SECRET="xxx"
   LARK_BASE_APP_TOKEN="bas_xxx"
   LARK_TABLE_ID_CSKH="tbl_xxx"
   ```

4. **Khởi tạo Schema**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Chạy Hệ Thống**
   ```bash
   npm run start:dev
   ```

---

## 🛠️ 6. Hướng Dẫn Vận Hành (Operational Guide)

### Thêm một Shop mới vào hệ thống
1. Đăng nhập vào trang Admin (hoặc gọi trực tiếp API Oauth của hệ thống).
2. Hệ thống chuyển hướng sang TikTok/Shopee để chủ Shop cấp quyền (Authorize).
3. Sau khi Callback thành công, hệ thống tự sinh Record vào bảng `Shop` và lưu `Token`.
4. **Kích hoạt Backfill**: Chạy Script `scripts/trigger-radar-vps.js` hoặc gọi API `POST /admin/reconcile/orders` để quét lùi dữ liệu lịch sử của Shop mới về Lark Base. Từ đây, Webhook sẽ tự động tiếp quản các đơn phát sinh mới.

### Xử lý Sự cố & Bảo trì
- **Mất Webhook**: Hệ thống có Cronjob đối soát (Reconcile) 10 phút/lần. Nếu mất Webhook, Cronjob sẽ tự động lấp đầy khoảng trống dữ liệu. Không cần can thiệp tay.
- **Thêm Cột mới trên Lark Base**: Cập nhật file `LarkPayload` trong code để ánh xạ trường dữ liệu mới -> Khởi động lại Server -> Đồng bộ sẽ tiếp tục với cột mới.
- **Kiểm tra Logs**: Toàn bộ Sync Logs và Lỗi đứt gãy được bắn thẳng vào Lark Bot hoặc lưu trong bảng `sync_logs`.

---

## 📂 7. Cấu trúc thư mục Chi tiết (Directory Structure)

Dưới đây là giải phẫu chi tiết cấu trúc mã nguồn trong thư mục \`src/\`, giúp các kỹ sư nắm bắt nhanh vị trí và chức năng của từng file để dễ dàng bảo trì và mở rộng:

### 🌟 Thư mục Root (\`src/\`)
- \`main.ts\`: Điểm khởi chạy (Entry point) của ứng dụng NestJS. Thiết lập Port, Global Pipes, Filters.
- \`app.module.ts\`: Module gốc, import tất cả các modules con của hệ thống (Prisma, Schedule, BullMQ, TikTok, Shopee, Sync...).
- \`health.controller.ts\`: API endpoint \`/health\` để Docker hoặc Kubernetes ping kiểm tra trạng thái sống (Liveness Probe).

### 🗂️ \`src/common/\` (Cấu hình dùng chung)
- \`constants.ts\`: Lưu trữ tất cả các hằng số tĩnh của dự án (Tên Queue, Tên Job, Prefix Redis, Magic Strings).
- \`prisma/prisma.service.ts\`: Wrapper của PrismaClient, chịu trách nhiệm kết nối và đóng gói các thao tác với PostgreSQL database.

### 🗂️ \`src/modules/\` (Các Phân Hệ Nghiệp Vụ Chức Năng)

#### 1. \`tiktok/\` (Giao tiếp với TikTok API)
- \`tiktok-api.client.ts\`: Đóng gói (Wrapper) toàn bộ các lệnh gọi API sang TikTok (Lấy đơn, Lấy danh sách trả hàng, Refresh Token) với cơ chế Retry khi gặp HTTP 429.
- \`tiktok-oauth.controller.ts\`: Xử lý luồng cấp quyền (OAuth 2.0) khi thêm Shop mới. Lưu trữ access_token và refresh_token.
- \`tiktok-webhook.controller.ts\`: Điểm hứng (Endpoint) nhận Push Events Realtime từ TikTok (ORDER_STATUS_CHANGE).
- \`tiktok-token.service.ts\`: Chạy Cronjob ngầm tự động làm mới Token trước khi chúng hết hạn.

#### 2. \`shopee/\` (Giao tiếp với Shopee API)
- Tương tự như cấu trúc của TikTok, đóng gói các luồng API, OAuth và Webhook chuyên biệt cho Shopee Open API v2.

#### 3. \`sync/\` (Trái tim Hệ thống Đồng bộ)
- \`normalizer.service.ts\`: Lớp chống tham nhũng dữ liệu (Anti-Corruption). Dịch payload thô phức tạp của TikTok/Shopee thành định dạng chuẩn chung \`NormalizedRequest\` của hệ thống.
- \`status-mapper.service.ts\`: Từ điển ánh xạ trạng thái. Ví dụ: Dịch trạng thái \`IN_TRANSIT\` của Shopee thành \`Đang giao\` trên Lark.
- \`sync-engine.service.ts\`: Core Engine nhận lệnh đồng bộ, xây dựng chuỗi Payload chuẩn xác để chuẩn bị bắn lên Lark. Ở đây có cơ chế bảo vệ (Preserve) dữ liệu người dùng không bị ghi đè.
- \`sync-worker.ts\`: Consumer của BullMQ. Rút các task đồng bộ từ Queue ra xử lý lần lượt để chống sập Lark API (Rate limit) và ghi log kết quả vào DB.

#### 4. \`failed-delivery/\` (Nghiệp vụ Giao Hàng Thất Bại)
- \`failed-delivery.service.ts\`: Xử lý nghiệp vụ chuyên sâu dò tìm và bắt các đơn bị giao thất bại. Nhận diện chính xác qua \`cancel_initiator\` và \`cancel_reason\`.
- \`failed-delivery.scheduler.ts\`: Cronjob tự động quét, chốt sổ ngày về kho hoặc cảnh báo các đơn Giao hàng thất bại bị treo quá hạn.

#### 5. \`reconcile/\` (Đối soát dữ liệu)
- \`reconcile.service.ts\`: Lớp chứa logic so khớp, tìm kiếm khoảng trống dữ liệu (Gaps). Có hàm kéo lùi dữ liệu lịch sử nhiều ngày (Backfill) và quét đơn lỗi.
- \`reconcile.scheduler.ts\`: Chứa 4 Cronjob cốt lõi (10 phút, 30 phút, Cuối ngày, Cuối tuần) liên tục gọi API hệ thống để chắp vá các webhook bị rớt (Missed Webhooks).

#### 6. \`lark/\` (Tương tác Lark Base)
- \`lark-api.client.ts\`: Giao tiếp với Lark Open API (Lấy Tenant Token, Fetch/Update/Create Record).
- \`lark-record.service.ts\`: Quản lý bộ đệm (Mapping) \`lark_records\` nội bộ để biết đơn hàng này tương ứng với dòng nào, ID nào trên Lark.
- \`lark-bot.service.ts\`: Xử lý bắn tin nhắn cảnh báo, báo cáo lỗi (Markdown format) vào các Group Chat CSKH qua Custom Bot Webhook.

#### 7. \`jt-express/\` (Đơn vị vận chuyển J&T)
- \`jt-express.client.ts\`: Bắt tay với J&T API để lấy vận đơn (Waybill) và trạng thái tracking realtime để xác nhận Ngày Về Kho cho các đơn chuyển hoàn.

#### 8. \`admin/\` (Quản trị Hệ thống)
- \`admin.controller.ts\`: Cung cấp các REST API cho nội bộ (hoặc Dashboard) để force-retry một đơn hàng bị lỗi, hoặc trigger thủ công tiến trình Reconcile từ ngày A đến ngày B.

## 🌐 8. Các API Endpoints Quan Trọng (Important Endpoints)

Hệ thống cung cấp một số API nội bộ để Admin điều khiển quá trình đồng bộ:

### A. Quản lý OAuth (Thêm Shop Mới)
- `GET /tiktok/oauth/authorize`: Trả về link để truy cập trang cấp quyền TikTok Shop.
- `GET /shopee/oauth/authorize`: Trả về link để truy cập trang cấp quyền Shopee.

### B. Admin & Đối soát thủ công (Manual Reconcile)
- `POST /admin/sync/retry`: Ép đồng bộ lại 1 đơn hàng bị kẹt. (Body: `{ "sync_key": "TIKTOK_shopId_orderId" }`)
- `POST /admin/reconcile/orders`: Ép hệ thống quét lùi (Backfill) toàn bộ đơn hàng trong 1 khoảng thời gian.
  - Body: `{ "shopId": "...", "from": "2026-06-20T00:00:00Z", "to": "2026-07-11T00:00:00Z" }`
- `POST /admin/reconcile/returns`: Ép quét lùi luồng Trả hàng/Hoàn tiền.

### C. Webhooks (Nhận Push từ nền tảng)
- `POST /api/webhook/tiktok`: Điểm hứng sự kiện Realtime từ TikTok.
- `POST /api/webhook/shopee`: Điểm hứng sự kiện Realtime từ Shopee.

---

## 🔐 9. Hướng dẫn Trust (Ủy quyền) các Shop mới

Khi bạn có một Cửa hàng (Shop) mới cần đưa vào hệ thống đồng bộ, hãy làm theo các bước sau:

**Bước 1: Sinh link Ủy quyền**
- Truy cập vào trình duyệt web bằng đường dẫn: `http://<domain-vps>/tiktok/oauth/authorize` (Thay bằng tên miền hoặc IP thực tế của VPS).
- URL này sẽ tự động điều hướng bạn đến trang Đăng nhập của TikTok Seller Center. Đối với Shopee, hãy gọi API tương ứng.

**Bước 2: Chủ Shop xác nhận (Trust)**
- Đăng nhập bằng tài khoản chủ Shop (Tài khoản chính hoặc tài khoản được phân quyền API).
- Bấm nút **"Authorize" (Ủy quyền)** trên giao diện màn hình cấp quyền của nền tảng.

**Bước 3: Hệ thống lưu Token**
- Sau khi bấm Ủy quyền, nền tảng sẽ đá bạn về link Callback của hệ thống (`/tiktok/oauth/callback`).
- Hệ thống tự động bắt lấy `auth_code`, đổi thành `access_token` và `refresh_token`, lưu trữ vĩnh viễn vào Database và tự động gia hạn ngầm định kỳ 24h. Kể từ lúc này, Webhook cho Shop này chính thức được kích hoạt!

**Bước 4: Backfill dữ liệu (Kéo bù dữ liệu cũ)**
- Rất quan trọng: Webhook chỉ bắt các đơn hàng **phát sinh sự kiện từ lúc cấp quyền trở đi**. Nó không tự động lấy dữ liệu quá khứ.
- Để hệ thống có dữ liệu cũ (Ví dụ: kéo bù 15 ngày trước đó), bạn dùng API `POST /admin/reconcile/orders` hoặc chạy script thủ công trên VPS để ép hệ thống lấp đầy dữ liệu vào Lark Base.

---

*Tài liệu được bảo trì bởi Tech Team. Vui lòng cập nhật tài liệu này nếu có sự thay đổi lớn về Kiến trúc (Architecture) hoặc Schema Database.*
