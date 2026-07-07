# Walkthrough - TikTok Shop → Lark Base Automation

## Tổng quan

Đã xây dựng hoàn chỉnh backend NestJS cho hệ thống tự động đồng bộ dữ liệu từ TikTok Shop vào Lark Base. Compilation thành công **0 errors**.

## Cấu trúc project đã tạo

```
d:\Tiktok\
├── src/
│   ├── main.ts                          # Bootstrap app
│   ├── app.module.ts                    # Root module (Config, BullMQ, Schedule, Prisma)
│   ├── health.controller.ts             # GET /health
│   ├── common/
│   │   ├── constants.ts                 # Queue names, job names, platforms, sync statuses
│   │   └── prisma/
│   │       ├── prisma.module.ts         # Global Prisma module
│   │       └── prisma.service.ts        # DB connection lifecycle
│   └── modules/
│       ├── tiktok/
│       │   ├── tiktok.module.ts
│       │   ├── tiktok-oauth.controller.ts    # GET /tiktok/oauth/authorize + callback
│       │   ├── tiktok-token.service.ts       # Token exchange, refresh, storage
│       │   ├── tiktok-api.client.ts          # Order/Return/Refund/Cancel APIs + signing
│       │   └── tiktok-webhook.controller.ts  # POST /webhooks/tiktok/order-status + return-status
│       ├── lark/
│       │   ├── lark.module.ts
│       │   ├── lark-api.client.ts            # tenant_access_token + CRUD + batch
│       │   ├── lark-record.service.ts        # 3-step upsert (DB→Lark search→create/update)
│       │   └── lark-bot.service.ts           # Alert + daily summary
│       ├── sync/
│       │   ├── sync.module.ts
│       │   ├── normalizer.service.ts         # TikTok→internal format + sync_key
│       │   ├── status-mapper.service.ts      # TikTok status → internal status mapping
│       │   ├── sync-engine.service.ts        # Core upsert flow + duplicate prevention
│       │   └── sync-worker.ts                # BullMQ worker processing queue jobs
│       ├── reconcile/
│       │   ├── reconcile.module.ts
│       │   ├── reconcile.service.ts          # Pull + sync orders/returns by time range
│       │   └── reconcile.scheduler.ts        # 4 cron jobs (10min, 30min, daily, weekly)
│       └── admin/
│           ├── admin.module.ts
│           └── admin.controller.ts           # Retry, reconcile, dashboard
├── prisma/
│   └── schema.prisma                    # 6 tables (shops, tokens, requests, lark_records, logs, events)
├── docker-compose.yml                   # PostgreSQL 16 + Redis 7
├── .env                                 # Local development config
├── .env.example                         # Template
└── package.json
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/health` | Health check |
| `GET` | `/tiktok/oauth/authorize` | Redirect sang TikTok OAuth |
| `GET` | `/tiktok/oauth/callback` | Nhận callback, đổi token |
| `POST` | `/webhooks/tiktok/order-status` | Webhook đơn hàng |
| `POST` | `/webhooks/tiktok/return-status` | Webhook hoàn/trả |
| `POST` | `/admin/sync/retry` | Retry sync_key |
| `POST` | `/admin/reconcile/orders` | Đối soát đơn hàng |
| `POST` | `/admin/reconcile/returns` | Đối soát hoàn/trả |
| `GET` | `/admin/dashboard` | Dashboard sức khỏe |

## Database Schema (6 bảng)

| Bảng | Mục đích |
|------|----------|
| `shops` | Cấu hình shop + brand |
| `tiktok_tokens` | Access/refresh token |
| `normalized_requests` | Dữ liệu đơn/yêu cầu đã chuẩn hóa |
| `lark_records` | Mapping sync_key ↔ lark_record_id |
| `sync_logs` | Log mọi hành động sync |
| `webhook_events` | Raw webhook payload cho audit |

## Cron Schedule

| Lịch | Hành động |
|------|-----------|
| Mỗi 10 phút | Kéo đơn thay đổi 30 phút gần nhất |
| Mỗi 30 phút | Kéo return/refund 2 giờ gần nhất |
| 02:00 hàng ngày | Đối soát 7 ngày + gửi daily summary |
| 03:00 Chủ nhật | Đối soát hoàn/trả 30 ngày |

## Status Mapping (theo yêu cầu user)

**Lưu ý quan trọng**: Hệ thống **KHÔNG** tự chuyển sang "Hoàn Tất" — team kho xử lý việc này.

## Verification

- ✅ TypeScript compilation: **0 errors**
- ✅ Project structure theo kiến trúc đã duyệt
- ✅ `.env` support ngrok local redirect URL

## Bước tiếp theo để chạy

### 1. Khởi động Docker containers
```bash
docker-compose up -d
```

### 2. Chạy database migration
```bash
npx prisma migrate dev --name init
```

### 3. Cấu hình credentials thật
Chỉnh sửa `.env` với:
- `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET` từ TikTok Partner Center
- `LARK_APP_ID`, `LARK_APP_SECRET` từ Lark Developer Console
- `LARK_BASE_APP_TOKEN`, `LARK_TABLE_ID_CSKH` từ Lark Base

### 4. Thêm shop vào database
```sql
INSERT INTO shops (platform, shop_id, shop_name, brand, is_active)
VALUES ('TIKTOK', 'your_shop_id', 'Tên Shop', 'CWELL', true);
```

### 5. Chạy server
```bash
npm run start:dev
```

### 6. Test OAuth (local với ngrok)
```bash
# Cài ngrok và expose port 3000
ngrok http 3000

# Cập nhật TIKTOK_REDIRECT_URI trong .env với URL ngrok
# Truy cập: http://localhost:3000/tiktok/oauth/authorize
```
