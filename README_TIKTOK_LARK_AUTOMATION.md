# README - Dự án tự động cập nhật đơn hàng TikTok Shop vào Lark Base

**Dự án:** TikTok Shop Order Sync → Lark Base CSKH  
**Mục tiêu:** Tự động hóa 100% việc cập nhật dữ liệu đơn hàng / hoàn trả / khiếu nại từ TikTok Shop về bảng Lark Base, giảm nhập tay, chống trùng, chống miss dữ liệu và có log kiểm soát.  
**Đối tượng sử dụng:** Team CSKH, vận hành sàn TikTok/Shopee, quản lý kho, quản lý vận hành.  
**Trạng thái tài liệu:** Bản định hướng triển khai tổng quan + chi tiết các phase.

---

## 1. Bối cảnh hiện tại

Hiện tại team CSKH đang quản lý dữ liệu đơn hàng trên Lark Base. Một số cột chính đang có trong bảng:

| Nhóm thông tin | Cột hiện tại trên Lark |
|---|---|
| Thời gian | Ngày về kho, Ngày tạo đơn |
| Kênh bán | Kênh bán |
| Thương hiệu | Thương hiệu |
| Đơn hàng | Mã đơn gốc, Mã đơn trả |
| Phân loại | Loại yêu cầu |
| Xử lý | Tình trạng xử lý, Khiếu nại, Ghi chú |

Vấn đề hiện tại:

- Nhân sự phải tự kiểm tra đơn trên TikTok Shop.
- Sau đó nhập tay vào Lark Base.
- Dễ chậm, dễ sai mã đơn, dễ thiếu đơn, dễ trùng đơn.
- Khi đơn đổi trạng thái, nhân sự phải quay lại cập nhật thủ công.
- Không có log để biết đơn nào đồng bộ lỗi, lỗi ở đâu, ai đã sửa gì.

Mục tiêu của dự án là chuyển quy trình này sang mô hình tự động:

```text
TikTok Shop API/Webhook
        ↓
Backend Automation Server
        ↓
Database trung gian + Queue xử lý
        ↓
Lark Base API
        ↓
Team CSKH theo dõi và xử lý trên Lark như hiện tại
```

---

## 2. Nguyên tắc thiết kế hệ thống

### 2.1. Không phụ thuộc 100% vào webhook

Webhook giúp cập nhật gần realtime, nhưng có thể bị miss do lỗi mạng, lỗi server, timeout hoặc TikTok retry thất bại.

Vì vậy hệ thống phải có 2 lớp:

```text
Lớp 1: Webhook realtime
Lớp 2: Cron đối soát định kỳ
```

Webhook dùng để cập nhật nhanh. Cron dùng để kéo lại dữ liệu trong khoảng thời gian gần nhất để chống miss.

### 2.2. Không ghi đè toàn bộ dữ liệu nhân sự nhập

Các cột từ TikTok thì hệ thống tự cập nhật. Các cột nội bộ như ghi chú CSKH, người phụ trách, kết quả xử lý nội bộ thì không nên ghi đè.

Nên tách rõ:

```text
Cột tự động:
- Kênh bán
- Thương hiệu
- Ngày tạo đơn
- Mã đơn gốc
- Mã đơn trả
- Loại yêu cầu
- Tình trạng xử lý
- Khiếu nại
- Ghi chú hệ thống

Cột thủ công:
- Người phụ trách
- Ghi chú CSKH
- Kết quả xử lý nội bộ
- Hẹn xử lý lại
- File / hình ảnh bằng chứng nội bộ nếu có
```

### 2.3. Luôn có khóa chống trùng

Không dùng mỗi `order_id` làm khóa chính vì một đơn có thể có nhiều yêu cầu: hoàn hàng, hoàn tiền, hủy đơn, khiếu nại.

Khóa đồng bộ nên dùng:

```text
sync_key = platform + shop_id + brand + order_id + request_type + request_id
```

Ví dụ:

```text
TIKTOK_749xxxx_CWELL_260420AU313MXC_RETURN_SPXVN067799085564
```

Nếu không có `return_id`, `refund_id`, `cancel_id`, có thể dùng:

```text
TIKTOK_749xxxx_CWELL_260420AU313MXC_ORDER_ONLY
```

### 2.4. Backend là trung tâm, Lark chỉ là nơi hiển thị

Không nên để Lark Bot hoặc Lark Automation làm toàn bộ logic. Lý do:

- OAuth TikTok cần Redirect URL riêng.
- Cần xử lý access token / refresh token.
- Cần verify webhook signature.
- Cần retry, queue, rate limit.
- Cần log lỗi.
- Cần upsert record vào Lark.
- Sau này còn mở rộng sang Shopee, kho, vận chuyển, bảo hành.

Lark nên đóng vai trò:

```text
- Bảng làm việc cho CSKH
- Nơi hiển thị trạng thái đơn
- Nơi nhân sự xử lý, lọc, nhóm, báo cáo
- Kênh nhận cảnh báo qua Lark Bot
```

---

## 3. Kiến trúc tổng quan

```text
┌─────────────────────────────┐
│        TikTok Shop           │
│  - Order API                 │
│  - Return/Refund/Cancel API  │
│  - Webhook Events            │
└──────────────┬──────────────┘
               │
               │ OAuth / Webhook / API Pull
               ▼
┌─────────────────────────────┐
│ Backend Automation Server    │
│  - OAuth callback            │
│  - Webhook receiver          │
│  - Token manager             │
│  - Order normalizer          │
│  - Status mapper             │
│  - Sync engine               │
│  - Retry handler             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Database trung gian          │
│  - shops                     │
│  - tiktok_tokens             │
│  - orders                    │
│  - return_requests           │
│  - lark_records              │
│  - sync_logs                 │
│  - webhook_events            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Queue / Job Worker           │
│  - sync_order_to_lark        │
│  - sync_return_to_lark       │
│  - reconcile_orders          │
│  - reconcile_returns         │
│  - retry_failed_jobs         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Lark                         │
│  - Lark Base CSKH            │
│  - Lark Bot cảnh báo         │
│  - View theo team xử lý      │
└─────────────────────────────┘
```

---

## 4. Stack công nghệ đề xuất

Có 2 hướng phù hợp.

### Option A - Node.js / NestJS

Phù hợp nếu team muốn hệ thống backend có cấu trúc rõ, dễ mở rộng.

```text
Backend: Node.js + NestJS + TypeScript
Database: PostgreSQL
Queue: Redis + BullMQ
ORM: Prisma
Deploy: Docker + VPS / Render / Railway / Cloud Run
Log: Sentry + database sync_logs
Bot: Lark Custom Bot
```

Ưu điểm:

- TypeScript chặt chẽ.
- NestJS phù hợp hệ thống nhiều module.
- BullMQ xử lý queue ổn.
- Dễ mở rộng thêm Shopee.

### Option B - Python / FastAPI

Phù hợp nếu team muốn code nhanh, dễ đọc, dễ tích hợp automation.

```text
Backend: Python + FastAPI
Database: PostgreSQL
Queue: Redis + Celery / RQ
ORM: SQLAlchemy
Deploy: Docker + VPS / Render / Railway / Cloud Run
Log: Sentry + database sync_logs
Bot: Lark Custom Bot
```

Ưu điểm:

- Code nhanh, dễ đọc.
- Phù hợp automation.
- Dễ build script đối soát.

### Đề xuất chọn

Nếu làm dự án dài hạn và có thể mở rộng sang Shopee, kho, bảo hành, nên chọn:

```text
Node.js + NestJS + PostgreSQL + Redis + BullMQ + Docker
```

---

## 5. Các module chính cần xây

### 5.1. Module TikTok OAuth

Nhiệm vụ:

- Tạo authorization link cho seller cấp quyền.
- Nhận callback từ TikTok.
- Đổi `auth_code` lấy `access_token` và `refresh_token`.
- Lưu token theo shop.
- Refresh token khi gần hết hạn.

Endpoint đề xuất:

```http
GET /tiktok/oauth/authorize
GET /tiktok/oauth/callback
POST /tiktok/oauth/refresh
```

Redirect URL điền vào TikTok Partner Center:

```text
https://automation.sunboxholdings.sg/tiktok/oauth/callback
```

Trong môi trường test có thể dùng:

```text
https://xxx.ngrok-free.app/tiktok/oauth/callback
```

Lưu ý:

- Redirect URL nên là HTTPS.
- Không dùng URL Lark Docs, Lark Base hoặc Lark Bot.
- Backend phải check `state` để chống request giả mạo.
- Token không lưu trong code, phải lưu database hoặc secret manager.

---

### 5.2. Module TikTok Webhook

Nhiệm vụ:

- Nhận event đơn mới / đổi trạng thái đơn.
- Nhận event hoàn/trả/hủy nếu TikTok hỗ trợ topic tương ứng.
- Verify chữ ký webhook.
- Lưu raw payload để audit.
- Đẩy job vào queue để xử lý sau, không xử lý nặng ngay trong request webhook.

Endpoint đề xuất:

```http
POST /webhooks/tiktok/order-status
POST /webhooks/tiktok/return-status
POST /webhooks/tiktok/refund-status
POST /webhooks/tiktok/cancel-status
```

Quy trình xử lý webhook:

```text
1. Nhận request từ TikTok.
2. Verify signature.
3. Lưu event vào bảng webhook_events.
4. Trả HTTP 200 nhanh cho TikTok.
5. Đẩy job vào queue.
6. Worker gọi TikTok API lấy chi tiết đầy đủ.
7. Normalize dữ liệu.
8. Upsert vào database.
9. Upsert vào Lark Base.
10. Ghi sync log.
```

---

### 5.3. Module TikTok API Client

Nhiệm vụ:

- Gọi TikTok Shop API.
- Tự ký request nếu API yêu cầu.
- Tự refresh token khi token hết hạn.
- Có retry khi lỗi tạm thời.
- Có rate limit.

Các hàm cần có:

```ts
getOrderList(params)
getOrderDetail(orderId)
getReturnList(params)
getReturnDetail(returnId)
getRefundList(params)
getCancelList(params)
refreshAccessToken(shopId)
```

Nguyên tắc:

- Không gọi TikTok API trực tiếp từ controller.
- Tất cả qua service/client chung.
- Log request_id hoặc trace_id nếu TikTok trả về.
- Không log full token, địa chỉ, số điện thoại khách.

---

### 5.4. Module Data Normalizer

Nhiệm vụ:

Chuyển dữ liệu TikTok thành format chuẩn nội bộ, không để logic Lark phụ thuộc trực tiếp vào format TikTok.

Ví dụ format chuẩn:

```json
{
  "platform": "TIKTOK",
  "shop_id": "749xxxx",
  "brand": "CWELL",
  "order_id": "260420AU313MXC",
  "request_id": "SPXVN067799085564",
  "request_type": "RETURN",
  "order_created_at": "2026-04-20T13:00:00+07:00",
  "warehouse_received_at": "2026-04-22T12:55:00+07:00",
  "internal_status": "HOAN_TAT",
  "is_complaint": false,
  "system_note": "Đơn giao kho thành công. Mã đơn trả: SPXVN067799085564"
}
```

---

### 5.5. Module Status Mapping

Nhiệm vụ:

Mapping trạng thái TikTok sang trạng thái nội bộ trong Lark.

Ví dụ mapping đơn hàng:

| TikTok status | Trạng thái nội bộ đề xuất |
|---|---|
| UNPAID | Chưa thanh toán |
| ON_HOLD | Đang giữ đơn |
| AWAITING_SHIPMENT | Chờ xử lý vận chuyển |
| AWAITING_COLLECTION | Chờ đơn vị vận chuyển lấy hàng |
| IN_TRANSIT | Đang giao |
| DELIVERED | Đã giao |
| COMPLETED | Hoàn tất |
| CANCELLED | Đã hủy |

Ví dụ mapping hoàn/trả:

| Nhóm trạng thái TikTok | Trạng thái nội bộ đề xuất |
|---|---|
| Return requested | Chờ xử lý |
| Seller reviewing | Đang xử lý |
| Buyer shipped | Khách đã gửi hàng |
| Return in transit | Đang hoàn về kho |
| Warehouse received | Đã về kho |
| Refund success | Hoàn tất |
| Request rejected | Từ chối |
| Cancelled | Đã hủy |

Nên cấu hình mapping trong file hoặc database để sau này đổi tên trạng thái mà không phải sửa code.

---

### 5.6. Module Lark API Client

Nhiệm vụ:

- Lấy `tenant_access_token`.
- Search record theo `sync_key`.
- Create record nếu chưa có.
- Update record nếu đã có.
- Batch create / batch update nếu nhiều dòng.
- Gửi message qua Lark Bot khi lỗi.

Các hàm cần có:

```ts
getTenantAccessToken()
searchRecordBySyncKey(syncKey)
createRecord(payload)
updateRecord(recordId, payload)
batchCreateRecords(records)
batchUpdateRecords(records)
sendBotMessage(message)
```

Nguyên tắc:

- App Lark phải được add vào Base với quyền phù hợp.
- Không thao tác trực tiếp quá nhiều request nhỏ nếu có thể batch.
- Luôn lưu `record_id` Lark vào database sau khi tạo.
- Khi update, chỉ update các field tự động.

---

### 5.7. Module Sync Engine

Nhiệm vụ:

Quyết định khi nào tạo mới, khi nào cập nhật, khi nào bỏ qua.

Flow upsert:

```text
1. Nhận normalized order/return.
2. Tạo sync_key.
3. Tìm trong database bảng lark_records.
4. Nếu đã có lark_record_id:
      update record trên Lark.
5. Nếu chưa có:
      search trên Lark theo sync_key.
6. Nếu Lark có record:
      update record và lưu lại record_id.
7. Nếu Lark chưa có:
      create record mới.
8. Ghi sync_logs.
```

Logic chống update thừa:

```text
Nếu last_tiktok_update_time <= last_synced_tiktok_update_time
→ bỏ qua, không update Lark.
```

Logic bảo vệ dữ liệu thủ công:

```text
Chỉ update field tự động.
Không update:
- Người phụ trách
- Ghi chú CSKH
- Kết quả xử lý nội bộ
- File bằng chứng nội bộ
```

---

### 5.8. Module Cron Reconciliation

Nhiệm vụ:

Đối soát định kỳ để chống miss webhook.

Lịch đề xuất:

```text
Mỗi 10 phút:
- Kéo đơn thay đổi trong 30 phút gần nhất.

Mỗi 30 phút:
- Kéo return/refund/cancel thay đổi trong 2 giờ gần nhất.

Mỗi ngày 02:00:
- Đối soát toàn bộ đơn 7 ngày gần nhất.

Mỗi tuần:
- Đối soát đơn hoàn/trả/khiếu nại 30 ngày gần nhất.
```

Lưu ý:

- Thời gian query nên có overlap, ví dụ chạy mỗi 10 phút nhưng kéo 30 phút gần nhất.
- Chống trùng bằng `sync_key`.
- Job phải idempotent: chạy lại nhiều lần không tạo trùng record.

---

### 5.9. Module Alert / Monitoring

Nhiệm vụ:

Gửi cảnh báo tới Lark khi có lỗi hoặc dữ liệu bất thường.

Các loại cảnh báo nên có:

```text
- Không lấy được TikTok token.
- TikTok API trả lỗi liên tục.
- Lark API trả lỗi quyền truy cập.
- Không tìm thấy bảng/cột Lark.
- Một đơn sync thất bại quá 3 lần.
- Webhook signature không hợp lệ.
- Cron đối soát không chạy.
- Số lượng đơn sync hôm nay thấp bất thường.
```

Ví dụ message gửi vào group Lark:

```text
[CẢNH BÁO SYNC TIKTOK → LARK]

Shop: CWELL TikTok
Loại lỗi: Lark update failed
Mã đơn: 260420AU313MXC
Mã yêu cầu: SPXVN067799085564
Lỗi: field "Tình trạng xử lý" not found
Thời gian: 2026-07-07 10:15
Action: Kiểm tra lại field_id trong cấu hình.
```

---

## 6. Cấu trúc Lark Base đề xuất

### 6.1. Bảng chính: CSKH đơn hàng / hoàn trả

Nên giữ các cột hiện tại và bổ sung một số cột kỹ thuật.

| Tên cột | Loại cột | Nguồn | Ghi chú |
|---|---|---|---|
| Ngày về kho | DateTime | Auto / kho | Từ TikTok hoặc hệ thống kho |
| Kênh bán | Single select | Auto | TikTok / Shopee |
| Thương hiệu | Single select | Auto | GOODFIT / CWELL / brand khác |
| Ngày tạo đơn | DateTime | Auto | Từ TikTok order |
| Mã đơn gốc | Text | Auto | TikTok order_id |
| Mã đơn trả | Text | Auto | return_id / refund_id / cancel_id |
| Loại yêu cầu | Single select | Auto | Đơn hàng / Hoàn hàng / Hoàn tiền / Hủy / Khiếu nại |
| Tình trạng xử lý | Single select | Auto + có kiểm soát | Mapping từ TikTok |
| Khiếu nại | Checkbox | Auto | Tick nếu có dispute/complaint |
| Ghi chú hệ thống | Text | Auto | Note sinh tự động |
| Người phụ trách | User | Manual | CSKH tự chọn |
| Ghi chú CSKH | Text | Manual | Không ghi đè |
| Kết quả xử lý nội bộ | Single select | Manual | Không ghi đè |
| sync_key | Text | Auto | Ẩn |
| platform | Text | Auto | Ẩn |
| shop_id | Text | Auto | Ẩn |
| request_id | Text | Auto | Ẩn |
| last_tiktok_update_time | DateTime | Auto | Ẩn |
| last_synced_at | DateTime | Auto | Ẩn |
| sync_status | Single select | Auto | SUCCESS / FAILED / SKIPPED |
| sync_error | Text | Auto | Lỗi gần nhất nếu có |

### 6.2. Bảng cấu hình brand/shop

| Cột | Ý nghĩa |
|---|---|
| shop_id | ID shop TikTok |
| shop_name | Tên shop |
| platform | TikTok / Shopee |
| brand | GOODFIT / CWELL |
| is_active | Bật/tắt sync |
| lark_table_id | Table cần ghi |
| default_channel_name | Tên kênh bán hiển thị |
| timezone | Múi giờ |

### 6.3. Bảng logs

| Cột | Ý nghĩa |
|---|---|
| trace_id | Mã tracking nội bộ |
| sync_key | Khóa đồng bộ |
| action | CREATE / UPDATE / SKIP / ERROR |
| source | WEBHOOK / CRON / MANUAL_RETRY |
| status | SUCCESS / FAILED |
| error_message | Nội dung lỗi |
| payload_snapshot | Snapshot rút gọn |
| created_at | Thời gian |

---

## 7. Database schema đề xuất

### 7.1. shops

```sql
CREATE TABLE shops (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  shop_id VARCHAR(100) NOT NULL,
  shop_name VARCHAR(255),
  brand VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, shop_id)
);
```

### 7.2. tiktok_tokens

```sql
CREATE TABLE tiktok_tokens (
  id BIGSERIAL PRIMARY KEY,
  shop_id VARCHAR(100) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token_expired_at TIMESTAMP,
  refresh_token_expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id)
);
```

### 7.3. normalized_requests

```sql
CREATE TABLE normalized_requests (
  id BIGSERIAL PRIMARY KEY,
  sync_key VARCHAR(500) NOT NULL UNIQUE,
  platform VARCHAR(50) NOT NULL,
  shop_id VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  order_id VARCHAR(100) NOT NULL,
  request_id VARCHAR(100),
  request_type VARCHAR(50),
  internal_status VARCHAR(100),
  is_complaint BOOLEAN DEFAULT FALSE,
  order_created_at TIMESTAMP,
  warehouse_received_at TIMESTAMP,
  last_tiktok_update_time TIMESTAMP,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.4. lark_records

```sql
CREATE TABLE lark_records (
  id BIGSERIAL PRIMARY KEY,
  sync_key VARCHAR(500) NOT NULL UNIQUE,
  lark_app_token VARCHAR(255) NOT NULL,
  lark_table_id VARCHAR(255) NOT NULL,
  lark_record_id VARCHAR(255) NOT NULL,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.5. sync_logs

```sql
CREATE TABLE sync_logs (
  id BIGSERIAL PRIMARY KEY,
  trace_id VARCHAR(100),
  sync_key VARCHAR(500),
  action VARCHAR(50),
  source VARCHAR(50),
  status VARCHAR(50),
  error_message TEXT,
  payload_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.6. webhook_events

```sql
CREATE TABLE webhook_events (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  event_type VARCHAR(100),
  event_id VARCHAR(255),
  shop_id VARCHAR(100),
  order_id VARCHAR(100),
  raw_payload JSONB,
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, event_id)
);
```

---

## 8. Environment variables

```env
# App
APP_ENV=production
APP_PORT=3000
APP_BASE_URL=https://automation.sunboxholdings.sg
APP_TIMEZONE=Asia/Ho_Chi_Minh

# Database
DATABASE_URL=postgresql://user:password@host:5432/tiktok_lark_sync

# Redis
REDIS_URL=redis://host:6379

# TikTok Shop
TIKTOK_APP_KEY=xxx
TIKTOK_APP_SECRET=xxx
TIKTOK_WEBHOOK_SECRET=xxx
TIKTOK_REDIRECT_URI=https://automation.sunboxholdings.sg/tiktok/oauth/callback

# Lark
LARK_APP_ID=cli_xxx
LARK_APP_SECRET=xxx
LARK_BASE_APP_TOKEN=xxx
LARK_TABLE_ID_TIKTOK_CSKH=tbl_xxx
LARK_BOT_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/xxx

# Security
OAUTH_STATE_SECRET=xxx
TOKEN_ENCRYPTION_KEY=xxx

# Monitoring
SENTRY_DSN=xxx
```

---

## 9. API endpoints nội bộ

### 9.1. Health check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "time": "2026-07-07T10:00:00+07:00"
}
```

### 9.2. TikTok OAuth authorize

```http
GET /tiktok/oauth/authorize?shop_hint=CWELL
```

Nhiệm vụ:

- Sinh authorization URL.
- Sinh `state`.
- Redirect user sang TikTok để cấp quyền.

### 9.3. TikTok OAuth callback

```http
GET /tiktok/oauth/callback?code=xxx&state=yyy
```

Nhiệm vụ:

- Kiểm tra `state`.
- Đổi `code` lấy token.
- Lưu token.
- Hiển thị trang thành công.

### 9.4. TikTok webhook

```http
POST /webhooks/tiktok/order-status
POST /webhooks/tiktok/return-status
```

Nhiệm vụ:

- Verify signature.
- Lưu event.
- Đẩy job.

### 9.5. Manual retry

```http
POST /admin/sync/retry
```

Body:

```json
{
  "sync_key": "TIKTOK_749xxxx_CWELL_260420AU313MXC_RETURN_SPXVN067799085564"
}
```

### 9.6. Manual reconcile

```http
POST /admin/reconcile/orders
```

Body:

```json
{
  "shop_id": "749xxxx",
  "from": "2026-07-01T00:00:00+07:00",
  "to": "2026-07-07T23:59:59+07:00"
}
```

---

## 10. Chi tiết các phase triển khai

## Phase 0 - Khảo sát & chốt phạm vi

### Mục tiêu

Chốt rõ dữ liệu nào cần tự động, bảng nào cần ghi, shop nào cần kết nối, trạng thái nào cần mapping.

### Việc cần làm

1. Chốt danh sách shop TikTok cần sync.
2. Chốt danh sách thương hiệu:
   - GOODFIT
   - CWELL
   - Các brand khác nếu có.
3. Chốt bảng Lark đích:
   - App token
   - Table ID
   - View ID nếu cần
4. Chốt field Lark:
   - Tên field
   - Field ID
   - Kiểu field
   - Field nào auto
   - Field nào manual
5. Chốt logic `Ngày về kho`:
   - Lấy theo TikTok báo hàng hoàn đã giao?
   - Hay theo kho nội bộ xác nhận đã nhận?
6. Chốt loại yêu cầu cần sync:
   - Đơn mới
   - Đơn đổi trạng thái
   - Hoàn hàng
   - Hoàn tiền
   - Hủy đơn
   - Khiếu nại
7. Chốt SLA cập nhật:
   - Realtime trong 1-5 phút?
   - Hay chấp nhận 10-30 phút?
8. Chốt quyền truy cập:
   - Ai có quyền cấp quyền TikTok?
   - Ai quản lý app Lark?
   - Ai nhận cảnh báo lỗi?

### Deliverables

```text
- Bản mapping field TikTok → Lark.
- Bản mapping trạng thái TikTok → trạng thái nội bộ.
- Danh sách shop/brand cần sync.
- Danh sách field Lark cần thêm.
- Quyết định nguồn của "Ngày về kho".
```

### Acceptance criteria

```text
- Có file mapping đầy đủ.
- Có quyền truy cập TikTok Partner Center.
- Có quyền tạo Lark Custom App.
- Có quyền chỉnh sửa Lark Base.
```

---

## Phase 1 - Chuẩn hóa Lark Base

### Mục tiêu

Chuẩn hóa bảng Lark để sẵn sàng nhận dữ liệu tự động.

### Việc cần làm

1. Sao lưu bảng hiện tại.
2. Tạo thêm các cột kỹ thuật:
   - sync_key
   - platform
   - shop_id
   - request_id
   - last_tiktok_update_time
   - last_synced_at
   - sync_status
   - sync_error
3. Tạo hoặc chuẩn hóa option cho các cột single select:
   - Kênh bán
   - Thương hiệu
   - Loại yêu cầu
   - Tình trạng xử lý
4. Tạo view riêng:
   - View tất cả đơn TikTok
   - View đơn cần xử lý
   - View đơn hoàn về kho
   - View khiếu nại
   - View sync lỗi
5. Ẩn các cột kỹ thuật khỏi view làm việc chính.
6. Chốt field ID từng cột để backend dùng ổn định.

### Deliverables

```text
- Bảng Lark đã có cột kỹ thuật.
- View vận hành cho CSKH.
- View debug cho admin.
- File cấu hình field_id.
```

### Acceptance criteria

```text
- Backend có thể tạo thử 1 record test.
- Backend có thể update thử 1 record test.
- CSKH vẫn dùng bảng bình thường.
- Không mất dữ liệu cũ.
```

---

## Phase 2 - Tạo TikTok Shop App & OAuth

### Mục tiêu

Tạo app TikTok Shop, cấu hình Redirect URL và lấy được token shop.

### Việc cần làm

1. Tạo app trong TikTok Shop Partner Center.
2. Cấu hình Redirect URL:

```text
https://automation.sunboxholdings.sg/tiktok/oauth/callback
```

3. Xin các quyền cần thiết:
   - Đọc đơn hàng.
   - Đọc thông tin fulfillment/logistics.
   - Đọc hoàn hàng/hoàn tiền/hủy đơn.
   - Đọc webhook events nếu cần.
4. Build endpoint:

```http
GET /tiktok/oauth/authorize
GET /tiktok/oauth/callback
```

5. Test cấp quyền shop.
6. Lưu token vào database.
7. Test refresh token.

### Deliverables

```text
- TikTok Shop App đã hoạt động.
- Redirect URL chạy được.
- Shop token đã lưu database.
- Có màn hình/câu thông báo cấp quyền thành công.
```

### Acceptance criteria

```text
- Seller bấm link cấp quyền và hoàn tất được.
- Backend nhận được auth code.
- Backend đổi được token.
- Backend gọi thử được API lấy thông tin đơn.
```

---

## Phase 3 - Tạo Lark Custom App & quyền Base

### Mục tiêu

Backend gọi được Lark Base API để tạo, search và update record.

### Việc cần làm

1. Tạo Lark Custom App.
2. Lấy `app_id`, `app_secret`.
3. Cấp quyền Base API cần thiết.
4. Add app vào Base với quyền phù hợp.
5. Build Lark API client:
   - getTenantAccessToken
   - searchRecordBySyncKey
   - createRecord
   - updateRecord
6. Test tạo record.
7. Test update record.
8. Test search record theo `sync_key`.

### Deliverables

```text
- Lark Custom App đã có quyền.
- Lark API client hoạt động.
- Tạo/update/search record thành công.
```

### Acceptance criteria

```text
- Gọi API tạo được 1 record test trong Lark.
- Gọi API update được record test.
- Gọi API search được record theo sync_key.
- Token Lark tự refresh/cache được.
```

---

## Phase 4 - Build Backend Core

### Mục tiêu

Tạo khung backend đủ module để triển khai sync.

### Việc cần làm

1. Setup repository.
2. Setup Docker.
3. Setup PostgreSQL.
4. Setup Redis.
5. Setup migration database.
6. Setup module config/env.
7. Setup logging.
8. Setup error handler.
9. Setup health check.
10. Setup queue worker.
11. Setup scheduler/cron.
12. Setup Sentry hoặc hệ thống log tương đương.

### Cấu trúc thư mục đề xuất

```text
src/
  modules/
    tiktok/
      tiktok-oauth.controller.ts
      tiktok-api.client.ts
      tiktok-webhook.controller.ts
      tiktok-token.service.ts
    lark/
      lark-api.client.ts
      lark-record.service.ts
      lark-bot.service.ts
    sync/
      sync-engine.service.ts
      normalizer.service.ts
      status-mapper.service.ts
      sync-worker.ts
    reconcile/
      reconcile.scheduler.ts
      reconcile.service.ts
    admin/
      admin.controller.ts
  common/
    logger/
    errors/
    utils/
  config/
  database/
```

### Deliverables

```text
- Backend chạy được local.
- Database migration chạy được.
- Queue hoạt động.
- Health check OK.
- Log lỗi có trace_id.
```

### Acceptance criteria

```text
- Deploy được môi trường staging.
- Endpoint /health trả OK.
- Worker nhận và xử lý job test.
- Cron test chạy đúng lịch.
```

---

## Phase 5 - Sync đơn hàng cơ bản

### Mục tiêu

Tự động lấy đơn TikTok và ghi vào Lark Base.

### Việc cần làm

1. Build API client lấy danh sách đơn.
2. Build API client lấy chi tiết đơn.
3. Normalize order data.
4. Mapping trạng thái đơn.
5. Build `sync_key` cho đơn.
6. Upsert vào database.
7. Upsert vào Lark.
8. Ghi sync log.
9. Build cron kéo đơn 30 phút gần nhất.
10. Test với dữ liệu thật.

### Luồng dữ liệu

```text
Cron chạy mỗi 10 phút
        ↓
Gọi TikTok API lấy đơn thay đổi trong 30 phút gần nhất
        ↓
Với mỗi đơn:
  - Lấy detail
  - Normalize
  - Mapping trạng thái
  - Upsert DB
  - Upsert Lark
  - Ghi log
```

### Deliverables

```text
- Đơn TikTok tự động xuất hiện trên Lark.
- Đơn đổi trạng thái được update.
- Không tạo trùng record.
```

### Acceptance criteria

```text
- 100 đơn test sync không trùng.
- Đơn đã tồn tại thì update đúng record.
- Field manual không bị ghi đè.
- Log thể hiện rõ create/update/skip/error.
```

---

## Phase 6 - Sync hoàn hàng / hoàn tiền / hủy đơn / khiếu nại

### Mục tiêu

Tự động đồng bộ các yêu cầu sau bán vào bảng CSKH.

### Việc cần làm

1. Build API client lấy return/refund/cancel.
2. Normalize request data.
3. Mapping loại yêu cầu:
   - Hoàn hàng
   - Hoàn tiền
   - Hủy đơn
   - Khiếu nại
4. Mapping trạng thái xử lý.
5. Tạo `sync_key` riêng cho từng yêu cầu.
6. Cập nhật `Mã đơn trả`.
7. Cập nhật `Khiếu nại`.
8. Cập nhật `Ngày về kho` nếu có dữ liệu.
9. Sync vào Lark.
10. Tạo view "Đơn hoàn/trả cần xử lý".

### Deliverables

```text
- Return/refund/cancel tự động vào Lark.
- Trạng thái xử lý tự động cập nhật.
- Đơn khiếu nại được tick tự động nếu đủ điều kiện.
```

### Acceptance criteria

```text
- Một đơn có nhiều request không bị ghi đè sai.
- Mỗi request có sync_key riêng.
- Tình trạng xử lý đúng mapping.
- View "Khiếu nại" lọc đúng dữ liệu.
```

---

## Phase 7 - Webhook realtime

### Mục tiêu

Cập nhật gần realtime khi đơn TikTok thay đổi.

### Việc cần làm

1. Cấu hình webhook endpoint trong TikTok Shop App.
2. Subscribe topic order status update.
3. Nếu có topic return/refund/cancel thì subscribe thêm.
4. Verify signature.
5. Lưu raw webhook event.
6. Trả HTTP 200 nhanh.
7. Đẩy job vào queue.
8. Worker xử lý lại bằng cách gọi API detail.
9. Update Lark.
10. Gửi cảnh báo nếu webhook lỗi liên tục.

### Deliverables

```text
- Webhook endpoint hoạt động.
- Đơn đổi trạng thái được update nhanh.
- Có log raw event.
```

### Acceptance criteria

```text
- Khi đơn đổi trạng thái, Lark cập nhật trong SLA đã chốt.
- Webhook lỗi không làm mất dữ liệu vì có cron đối soát.
- Event duplicate không tạo trùng record.
```

---

## Phase 8 - Alert, Monitoring & Admin Tools

### Mục tiêu

Có khả năng theo dõi, cảnh báo và retry khi lỗi.

### Việc cần làm

1. Tạo bảng sync logs.
2. Tạo view sync lỗi trong Lark.
3. Gửi cảnh báo lỗi vào group Lark.
4. Tạo endpoint manual retry.
5. Tạo endpoint manual reconcile.
6. Tạo dashboard đơn giản:
   - Số đơn sync hôm nay
   - Số đơn lỗi
   - Lần cron cuối
   - Shop token còn hạn không
7. Cài Sentry hoặc logging service.

### Deliverables

```text
- Cảnh báo lỗi qua Lark Bot.
- Có retry thủ công.
- Có đối soát thủ công theo khoảng ngày.
- Có dashboard sức khỏe hệ thống.
```

### Acceptance criteria

```text
- Lỗi sync được phát hiện trong 5 phút.
- Có thể retry đơn lỗi mà không cần sửa database thủ công.
- Có thể xem được lý do lỗi.
```

---

## Phase 9 - UAT với team CSKH

### Mục tiêu

Test thực tế với quy trình vận hành của team.

### Việc cần làm

1. Chạy song song nhập tay và sync tự động trong 3-7 ngày.
2. So sánh dữ liệu TikTok vs Lark.
3. Kiểm tra các case:
   - Đơn mới
   - Đơn đang giao
   - Đơn hoàn tất
   - Đơn hủy
   - Đơn hoàn/trả
   - Đơn có khiếu nại
   - Đơn đổi trạng thái nhiều lần
4. Team CSKH feedback:
   - Tên trạng thái có dễ hiểu không?
   - View đã tiện chưa?
   - Ghi chú hệ thống có đủ chưa?
   - Có cần thêm cột nào không?
5. Sửa mapping và giao diện view.

### Deliverables

```text
- Biên bản UAT.
- Danh sách lỗi/phản hồi.
- Mapping final.
- Quy trình vận hành chính thức.
```

### Acceptance criteria

```text
- Tỷ lệ khớp dữ liệu >= 99%.
- Không có lỗi tạo trùng nghiêm trọng.
- Team CSKH xác nhận dùng được.
- Quản lý xác nhận báo cáo/view đạt yêu cầu.
```

---

## Phase 10 - Go-live

### Mục tiêu

Chuyển sang vận hành chính thức.

### Việc cần làm

1. Backup Lark Base trước go-live.
2. Chạy full sync dữ liệu 7-30 ngày gần nhất.
3. Bật cron chính thức.
4. Bật webhook chính thức.
5. Bật cảnh báo Lark Bot.
6. Tắt nhập tay với các cột auto.
7. Training team CSKH:
   - Cột nào tự động
   - Cột nào được sửa
   - Khi lỗi thì báo ai
   - Cách xem view lỗi
8. Theo dõi sát 3 ngày đầu.

### Deliverables

```text
- Hệ thống production chạy chính thức.
- Team CSKH sử dụng Lark như bảng vận hành chính.
- Không cần nhập tay các cột tự động.
```

### Acceptance criteria

```text
- Cron chạy ổn định.
- Webhook nhận ổn định.
- Không mất dữ liệu.
- Không có lỗi nghiêm trọng trong 3 ngày đầu.
```

---

## Phase 11 - Tối ưu sau go-live

### Mục tiêu

Tăng độ ổn định và mở rộng hệ thống.

### Việc cần làm

1. Tối ưu batch update Lark.
2. Tối ưu rate limit TikTok/Lark.
3. Tạo dashboard báo cáo:
   - Số đơn hoàn/trả theo ngày
   - Số khiếu nại
   - Tỷ lệ hoàn tất
   - SLA xử lý CSKH
4. Thêm phân quyền admin.
5. Thêm export báo cáo.
6. Thêm Shopee nếu cần.
7. Thêm kho nội bộ nếu cần xác nhận "Ngày về kho" chính xác.
8. Thêm tự động gán người phụ trách theo brand/shop/loại yêu cầu.

### Deliverables

```text
- Dashboard vận hành.
- Báo cáo tự động.
- Hệ thống sẵn sàng mở rộng sang Shopee/kho.
```

### Acceptance criteria

```text
- Dữ liệu ổn định.
- Team giảm thời gian nhập liệu thủ công.
- Có báo cáo quản lý rõ ràng.
```

---

## 11. Timeline đề xuất

### Bản MVP nhanh

| Phase | Thời gian |
|---|---:|
| Phase 0 - Khảo sát | 0.5 - 1 ngày |
| Phase 1 - Chuẩn hóa Lark | 0.5 - 1 ngày |
| Phase 2 - TikTok OAuth | 1 - 2 ngày |
| Phase 3 - Lark App | 0.5 - 1 ngày |
| Phase 4 - Backend Core | 1 - 2 ngày |
| Phase 5 - Sync đơn cơ bản | 2 - 3 ngày |
| Phase 6 - Sync hoàn/trả | 2 - 4 ngày |
| Phase 7 - Webhook | 1 - 2 ngày |
| Phase 8 - Alert/Monitoring | 1 - 2 ngày |
| Phase 9 - UAT | 3 - 7 ngày |
| Phase 10 - Go-live | 1 ngày |

Tổng thời gian MVP:

```text
Khoảng 2 - 4 tuần tùy quyền API, độ phức tạp mapping và số lượng shop.
```

### Bản production chuẩn

Nếu làm đầy đủ dashboard, retry, log, bảo mật token, deployment chuẩn, tài liệu vận hành:

```text
Khoảng 4 - 6 tuần.
```

---

## 12. Checklist triển khai

### Quyền và tài khoản

```text
[ ] Có quyền TikTok Shop Partner Center
[ ] Có quyền tạo TikTok Shop App
[ ] Có quyền admin shop TikTok để cấp quyền app
[ ] Có quyền Lark Developer Console
[ ] Có quyền chỉnh sửa Lark Base
[ ] Có quyền add app Lark vào Base
[ ] Có domain/subdomain cho backend
[ ] Có server/cloud để deploy
```

### Lark Base

```text
[ ] Backup bảng hiện tại
[ ] Thêm sync_key
[ ] Thêm platform
[ ] Thêm shop_id
[ ] Thêm request_id
[ ] Thêm last_tiktok_update_time
[ ] Thêm last_synced_at
[ ] Thêm sync_status
[ ] Thêm sync_error
[ ] Chuẩn hóa option "Kênh bán"
[ ] Chuẩn hóa option "Thương hiệu"
[ ] Chuẩn hóa option "Loại yêu cầu"
[ ] Chuẩn hóa option "Tình trạng xử lý"
[ ] Tạo view "Sync lỗi"
[ ] Tạo view "Khiếu nại"
[ ] Tạo view "Hoàn/trả cần xử lý"
```

### Backend

```text
[ ] Setup repo
[ ] Setup Docker
[ ] Setup database
[ ] Setup Redis
[ ] Setup env
[ ] Setup migration
[ ] Setup logging
[ ] Setup TikTok OAuth
[ ] Setup TikTok API Client
[ ] Setup Lark API Client
[ ] Setup Sync Engine
[ ] Setup Cron
[ ] Setup Webhook
[ ] Setup Alert Lark Bot
[ ] Setup Manual Retry
[ ] Setup Manual Reconcile
```

### Test

```text
[ ] Test OAuth TikTok
[ ] Test refresh token
[ ] Test lấy order list
[ ] Test lấy order detail
[ ] Test lấy return/refund/cancel
[ ] Test create Lark record
[ ] Test update Lark record
[ ] Test search Lark record
[ ] Test duplicate event
[ ] Test retry
[ ] Test cron overlap
[ ] Test webhook
[ ] Test lỗi token
[ ] Test lỗi Lark permission
[ ] Test field manual không bị ghi đè
```

---

## 13. Rủi ro và cách xử lý

### Rủi ro 1 - Webhook bị miss

Cách xử lý:

```text
Không phụ thuộc webhook. Luôn có cron kéo lại dữ liệu theo khoảng thời gian overlap.
```

### Rủi ro 2 - Lark đổi tên cột

Nếu backend dùng tên cột, khi đổi tên cột có thể lỗi.

Cách xử lý:

```text
Dùng field_id thay vì phụ thuộc hoàn toàn vào field name.
Có bảng cấu hình field mapping.
Có alert nếu field không tồn tại.
```

### Rủi ro 3 - Token TikTok hết hạn

Cách xử lý:

```text
Lưu refresh_token.
Tự refresh trước khi access_token hết hạn.
Alert nếu refresh thất bại.
```

### Rủi ro 4 - Tạo trùng record

Cách xử lý:

```text
Dùng sync_key.
Database unique constraint.
Search Lark trước khi create.
Job idempotent.
```

### Rủi ro 5 - Ghi đè ghi chú của CSKH

Cách xử lý:

```text
Tách "Ghi chú hệ thống" và "Ghi chú CSKH".
Backend chỉ update field auto.
```

### Rủi ro 6 - TikTok/Lark rate limit

Cách xử lý:

```text
Dùng queue.
Batch update.
Retry có backoff.
Không gọi API liên tục không kiểm soát.
```

### Rủi ro 7 - "Ngày về kho" không đúng thực tế

Cách xử lý:

```text
Cần chốt nguồn dữ liệu.
Nếu lấy theo TikTok: hiểu là thời điểm TikTok/logistics báo hoàn về.
Nếu lấy theo kho thật: cần tích hợp thêm quy trình scan nhận hàng hoặc hệ thống kho.
```

---

## 14. Quy trình vận hành sau go-live

### Team CSKH

```text
1. Mở view "Đơn cần xử lý".
2. Xử lý các dòng được tạo/cập nhật tự động.
3. Chỉ nhập các cột thủ công:
   - Người phụ trách
   - Ghi chú CSKH
   - Kết quả xử lý nội bộ
4. Không sửa sync_key, mã đơn, trạng thái auto.
5. Nếu thấy dữ liệu sai, báo admin qua group vận hành.
```

### Admin hệ thống

```text
1. Theo dõi view "Sync lỗi".
2. Theo dõi cảnh báo Lark Bot.
3. Retry các đơn lỗi nếu cần.
4. Kiểm tra token shop khi có lỗi xác thực.
5. Kiểm tra cron/webhook mỗi ngày trong tuần đầu.
```

### Developer

```text
1. Theo dõi log server.
2. Theo dõi Sentry.
3. Kiểm tra database sync_logs.
4. Xử lý lỗi mapping field.
5. Tối ưu batch/rate limit nếu volume tăng.
```

---

## 15. Đề xuất version triển khai

### Version 1.0 - MVP

```text
- TikTok OAuth
- Lark API
- Cron kéo đơn
- Sync đơn cơ bản
- Sync hoàn/trả cơ bản
- Upsert Lark
- Log cơ bản
```

### Version 1.1 - Realtime

```text
- Webhook order status
- Webhook return/refund nếu có
- Queue xử lý
- Alert Lark Bot
```

### Version 1.2 - Vận hành ổn định

```text
- Manual retry
- Manual reconcile
- Dashboard health
- View sync lỗi
- Báo cáo ngày
```

### Version 2.0 - Mở rộng

```text
- Sync Shopee
- Tích hợp kho nội bộ
- Gán người phụ trách tự động
- Báo cáo SLA CSKH
- Phân quyền admin
- Dashboard quản lý đa shop
```

---

## 16. Câu hỏi cần chốt trước khi bắt đầu code

1. Có bao nhiêu shop TikTok cần đồng bộ?
2. Mỗi shop tương ứng với brand nào?
3. Cột "Ngày về kho" lấy từ TikTok hay từ kho nội bộ?
4. Team có muốn đồng bộ cả đơn thường hay chỉ đồng bộ đơn hoàn/trả/khiếu nại?
5. Trạng thái "Tình trạng xử lý" hiện tại có những option nào?
6. Có cho phép hệ thống tự chuyển "Hoàn tất" không?
7. Cột "Ghi chú" hiện tại là ghi chú hệ thống hay ghi chú CSKH?
8. Có cần sync lịch sử 30/60/90 ngày không?
9. Ai là người nhận cảnh báo khi sync lỗi?
10. Dự kiến sau này có thêm Shopee không?

---

## 17. Tài liệu tham khảo chính thức

Các tài liệu này cần kiểm tra lại trong quá trình triển khai vì API có thể thay đổi theo thời gian.

```text
TikTok Shop Authorization Overview:
https://partner.tiktokshop.com/docv2/page/authorization-overview-202407

TikTok Shop Webhooks Overview:
https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview

TikTok Shop Order API Overview:
https://partner.tiktokshop.com/docv2/page/order-api-overview

TikTok Shop Return/Refund/Cancel API Overview:
https://partner.tiktokshop.com/docv2/page/return-refund-and-cancel-api-overview

Lark Base API Overview:
https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview

Lark tenant_access_token:
https://open.larksuite.com/document/server-docs/getting-started/api-access-token/auth-v3/tenant_access_token_internal
```

---

## 18. Kết luận

Phương án nên làm là:

```text
TikTok Shop API/Webhook
→ Backend Automation Server
→ Database + Queue
→ Lark Base API
→ Lark Bot cảnh báo
```

Không nên làm kiểu nhập tay hoặc dùng Lark Bot làm trung tâm xử lý. Lark nên là bảng vận hành cuối cùng, còn backend phải chịu trách nhiệm OAuth, webhook, token, retry, chống trùng, mapping và đồng bộ dữ liệu.

Ưu tiên triển khai theo thứ tự:

```text
1. Chuẩn hóa Lark Base.
2. Làm TikTok OAuth.
3. Làm Lark API client.
4. Làm cron sync đơn cơ bản.
5. Làm sync hoàn/trả.
6. Thêm webhook realtime.
7. Thêm alert/retry/dashboard.
8. Go-live.
```

Khi làm đúng kiến trúc này, team CSKH sẽ không cần nhập tay các cột từ TikTok nữa, dữ liệu được cập nhật gần realtime, có log để kiểm soát và có nền tảng để mở rộng sang Shopee/kho/bảo hành sau này.
