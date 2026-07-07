# Checkpoint - TikTok Shop to Lark Base Automation

Cap nhat: 2026-07-07

File nay dung de tiep tuc phien sau ma khong can doc lai toan bo code tu dau. Khong ghi secret/token that vao day.

## 1. Muc tieu du an

He thong backend tu dong dong bo du lieu TikTok Shop vao bang CSKH tren Lark Base.

Luon du lieu muc tieu:

```text
TikTok Shop API/Webhook
-> NestJS Backend
-> PostgreSQL + Redis/BullMQ
-> Normalize du lieu
-> Upsert vao Lark Base
-> Lark Bot canh bao loi
```

Bang Lark dang can cac cot chinh:

```text
Ngay ve kho
Kenh ban
Thuong hieu
Ngay tao don
Ma don goc
Ma don tra
Loai yeu cau
Tinh trang xu ly
Khieu nai
Ghi chu he thong
```

## 2. Stack hien tai

```text
Backend: NestJS 11 + TypeScript
HTTP client: @nestjs/axios + axios
Database: PostgreSQL
ORM: Prisma 7.8
Prisma adapter: @prisma/adapter-pg + pg
Queue: Redis + BullMQ
Scheduler: @nestjs/schedule
Tunnel local: cloudflared quick tunnel
```

Package scripts quan trong:

```bash
npm.cmd run build
npm.cmd run start
npm.cmd run start:dev
npm.cmd run start:prod
node scripts\preview-tiktok-orders.mjs
```

Luu y: `start:prod` da duoc sua thanh:

```json
"start:prod": "node dist/src/main"
```

Vi Nest build hien output vao `dist/src/main.js`.

## 3. Cau truc thu muc quan trong

```text
src/
  main.ts
  app.module.ts
  health.controller.ts
  common/
    constants.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
  modules/
    tiktok/
      tiktok.module.ts
      tiktok-oauth.controller.ts
      tiktok-token.service.ts
      tiktok-api.client.ts
      tiktok-webhook.controller.ts
    lark/
      lark.module.ts
      lark-api.client.ts
      lark-record.service.ts
      lark-bot.service.ts
    sync/
      sync.module.ts
      sync-engine.service.ts
      normalizer.service.ts
      status-mapper.service.ts
      sync-worker.ts
    reconcile/
      reconcile.module.ts
      reconcile.service.ts
      reconcile.scheduler.ts
    admin/
      admin.module.ts
      admin.controller.ts
prisma/
  schema.prisma
scripts/
  preview-tiktok-orders.mjs
```

## 4. Bien moi truong

File `.env` dang bi gitignore. Khong commit secret.

Bien app:

```env
APP_ENV=development
APP_PORT=3000
APP_BASE_URL=<public_https_base_url>
APP_TIMEZONE=Asia/Ho_Chi_Minh
```

Bien database:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tiktok_lark_sync?schema=public
```

Bien Redis:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Bien TikTok:

```env
TIKTOK_APP_KEY=<app_key>
TIKTOK_APP_SECRET=<hidden>
TIKTOK_WEBHOOK_SECRET=<hidden_or_configured_later>
TIKTOK_REDIRECT_URI=<public_https_base_url>/tiktok/oauth/callback
```

Bien Lark:

```env
LARK_APP_ID=<hidden>
LARK_APP_SECRET=<hidden>
LARK_BASE_APP_TOKEN=<hidden>
LARK_TABLE_ID_CSKH=<hidden>
LARK_BOT_WEBHOOK_URL=<hidden_or_optional>
```

Bien security:

```env
OAUTH_STATE_SECRET=<hidden>
TOKEN_ENCRYPTION_KEY=<hidden>
```

URL tunnel hien tai tai thoi diem checkpoint:

```text
https://bloomberg-electoral-dicke-joseph.trycloudflare.com
```

Redirect URL dang dung:

```text
https://bloomberg-electoral-dicke-joseph.trycloudflare.com/tiktok/oauth/callback
```

Can nho: Cloudflare quick tunnel co the rot/doi URL. Neu rot, tao tunnel moi va update `APP_BASE_URL`, `TIKTOK_REDIRECT_URI`, dong thoi update lai redirect URL trong TikTok Partner Center.

## 5. Database schema

Prisma schema co 6 model chinh:

```text
Shop
  platform
  shopId
  shopName
  brand
  isActive
  timezone

TiktokToken
  shopId
  accessToken
  refreshToken
  accessTokenExpiredAt
  refreshTokenExpiredAt

NormalizedRequest
  syncKey
  platform
  shopId
  brand
  orderId
  requestId
  requestType
  internalStatus
  isComplaint
  orderCreatedAt
  warehouseReceivedAt
  lastTiktokUpdateTime
  payload

LarkRecord
  syncKey
  larkAppToken
  larkTableId
  larkRecordId
  lastSyncedAt

SyncLog
  traceId
  syncKey
  action
  source
  status
  errorMessage
  payloadSnapshot

WebhookEvent
  platform
  eventType
  eventId
  shopId
  orderId
  rawPayload
  signatureValid
  processed
```

Prisma 7 trong project nay can adapter. `PrismaService` da duoc sua de dung:

```ts
import { PrismaPg } from '@prisma/adapter-pg';

super({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});
```

Da cai them dependency:

```text
@prisma/adapter-pg
pg
```

## 6. Backend endpoints hien co

Health:

```http
GET /health
```

TikTok OAuth:

```http
GET /tiktok/oauth/redirect-url
GET /tiktok/oauth/authorize
GET /tiktok/oauth/callback
```

TikTok webhook:

```http
POST /webhooks/tiktok/order-status
POST /webhooks/tiktok/return-status
```

Admin:

```http
GET  /admin/dashboard
POST /admin/sync/retry
POST /admin/reconcile/orders
POST /admin/reconcile/returns
```

## 7. Trang thai TikTok hien tai

Da lam xong:

```text
OAuth redirect public HTTPS da chay.
TikTok app key/app secret da cau hinh trong .env.
Seller GOODFIT Vietnam da authorize duoc.
Token da luu vao DB trong bang tiktok_tokens.
Goi duoc TikTok Shop API that.
Lay duoc authorized shop.
Lay duoc danh sach order.
Lay duoc order detail.
Lay duoc danh sach return/refund.
```

Ket qua TikTok authorized shops:

```json
{
  "name": "GOODFIT Vietnam",
  "region": "VN",
  "seller_type": "LOCAL",
  "id": "7494588178364533092",
  "code": "VNLC6WWLQL",
  "cipher": "ROW_D2UeSQAAAAB1IwVpcgK75rvfJTgtS1y3"
}
```

So lieu gan nhat khi preview:

```text
Orders total: khoang 7,762
Return/refund total: khoang 328
```

Script preview:

```text
scripts/preview-tiktok-orders.mjs
```

Chay:

```powershell
node scripts\preview-tiktok-orders.mjs
```

Neu network bi sandbox chan, can chay voi escalated permission.

## 8. TikTok Open API format da test thanh cong

Base URL:

```text
https://open-api.tiktokglobalshop.com
```

Header token bat buoc voi API moi:

```http
x-tts-access-token: <access_token>
```

Khong dung access token trong query param cho API moi `202309`.

Endpoint da test OK:

```http
GET  /authorization/202309/shops
POST /order/202309/orders/search
GET  /order/202309/orders
POST /return_refund/202309/returns/search
```

Endpoint return detail da thu nhung sai path:

```http
GET /return_refund/202309/returns/{return_id}
```

Ket qua: `404 Invalid path`.

Can tra doc/API Testing Tool de tim dung endpoint detail cho return/refund neu can.

Chu ky request:

```text
baseString = app_secret + path + sorted_query_without_sign_and_access_token + JSON.stringify(body_if_any) + app_secret
sign = HMAC-SHA256(baseString, app_secret).hex
```

Voi API moi:

```text
Query: app_key, timestamp, sign, shop_cipher/page_size/... tuy endpoint
Header: x-tts-access-token
Body: JSON filter
```

## 9. Mapping Lark da preview duoc

Cot Lark tu Order API:

```text
Ngay ve kho: trong
Kenh ban: TikTok
Thuong hieu: GOODFIT
Ngay tao don: create_time, format Asia/Ho_Chi_Minh yyyy/MM/dd HH:mm
Ma don goc: order.id
Ma don tra: trong
Loai yeu cau:
  COMPLETED -> Don hang hoan tat
  DELIVERED -> Don da giao
  CANCELLED -> Huy don
  default -> Don hang
Trang thai TikTok: order.status
Tong tien: order.payment.total_amount
```

Vi du Order API:

```text
Ngay ve kho: ''
Kenh ban: TikTok
Thuong hieu: GOODFIT
Ngay tao don: 2026/06/07 14:02
Ma don goc: 584411828692878532
Ma don tra: ''
Loai yeu cau: Don hang hoan tat
Trang thai TikTok: COMPLETED
Tong tien: 201900
```

Cot Lark tu Return/Refund API:

```text
Ngay ve kho: chua co trong sample page dau
Kenh ban: TikTok
Thuong hieu: GOODFIT
Ngay tao don: order_create_time hoac create_time
Ma don goc: order_id
Ma don tra: return_id/reverse_order_id/id/return_order_id
Loai yeu cau: Hoan/tra
Trang thai TikTok: return_status/reverse_order_status/status
```

Vi du Return/Refund API:

```text
Ngay ve kho: ''
Kenh ban: TikTok
Thuong hieu: GOODFIT
Ngay tao don: 2026/06/22 18:13
Ma don goc: 584586396531000909
Ma don tra: 4040968981764081229
Loai yeu cau: Hoan/tra
Trang thai TikTok: BUYER_SHIPPED_ITEM
```

## 10. Tinh trang code chinh hien tai

Quan trong: `scripts/preview-tiktok-orders.mjs` goi TikTok API moi thanh cong, nhung code chinh `src/modules/tiktok/tiktok-api.client.ts` van dang dung API legacy:

```text
/api/orders/search
/api/orders/detail/query
/api/reverse/list
/api/reverse/detail
/api/reverse/cancel/list
```

Can thay bang API moi `202309` va dung header `x-tts-access-token`.

`tiktok-oauth.controller.ts` da duoc bo sung:

```http
GET /tiktok/oauth/redirect-url
```

Va logic tao redirect URL:

```text
Uu tien TIKTOK_REDIRECT_URI.
Neu khong co thi dung APP_BASE_URL + /tiktok/oauth/callback.
```

`.gitignore` da them:

```text
*.log
```

de bo qua log local.

## 11. Phan Lark hien tai

Da co code:

```text
LarkApiClient:
  getTenantAccessToken
  searchRecords
  createRecord
  updateRecord
  batchCreateRecords
  batchUpdateRecords

LarkRecordService:
  upsertRecord theo sync_key
  DB -> search Lark -> create/update

LarkBotService:
  sendAlert
  sendSummary
```

Chua test thuc te Lark Base voi data TikTok moi.

Can xac minh:

```text
LARK_APP_ID
LARK_APP_SECRET
LARK_BASE_APP_TOKEN
LARK_TABLE_ID_CSKH
Field names trong Lark co khop voi payload khong
App Lark co quyen doc/ghi Base khong
```

## 12. Phan sync hien tai

Da co:

```text
SyncEngineService:
  syncOrder
  syncReturn
  processNormalizedData
  retrySyncBySyncKey

NormalizerService:
  normalizeOrder
  normalizeReturn
  build sync_key

StatusMapperService:
  mapOrderStatus
  mapReturnStatus
  mapRequestType

SyncWorker:
  nhan BullMQ job va goi TikTok API detail
```

Nhung:

```text
NormalizerService dang map theo payload legacy, chua map full payload 202309.
SyncWorker dang goi TiktokApiClient legacy.
ReconcileService dang goi TiktokApiClient legacy.
```

## 13. Cron/Reconcile hien tai

Da co schedule:

```text
Moi 10 phut: reconcileRecentOrders
Moi 30 phut: reconcileRecentReturns
02:00 hang ngay: reconcileWeeklyOrders
03:00 Chu nhat: reconcileMonthlyReturns
```

Nhung cac job nay chua san sang production vi client TikTok can doi sang API moi.

## 14. Webhook hien tai

Da co endpoint:

```http
POST /webhooks/tiktok/order-status
POST /webhooks/tiktok/return-status
```

Da co logic:

```text
verify signature bang TIKTOK_WEBHOOK_SECRET
luu raw payload vao webhook_events
push job vao BullMQ
```

Chua test webhook that tu TikTok.

Can lam:

```text
Cau hinh webhook URL trong TikTok Partner Center
Test order status event
Test return/refund status event
Kiem tra signature header TikTok dung ten gi voi API moi
```

Webhook URL neu tunnel hien tai con song:

```text
https://bloomberg-electoral-dicke-joseph.trycloudflare.com/webhooks/tiktok/order-status
https://bloomberg-electoral-dicke-joseph.trycloudflare.com/webhooks/tiktok/return-status
```

## 15. Nhung viec con thieu

Uu tien cao:

```text
1. Sua TiktokApiClient sang Open API 202309.
2. Them getAuthorizedShops() de lay shop cipher va shop id.
3. Luu GOODFIT Vietnam vao bang shops.
4. Sua getOrderList/getOrderDetail theo endpoint 202309.
5. Sua getReturnList theo endpoint /return_refund/202309/returns/search.
6. Xu ly pagination bang next_page_token.
7. Sua NormalizerService theo payload 202309 va cot Lark that.
8. Test sync 1-5 dong vao Lark Base.
9. Sau khi Lark OK, bat reconcile theo khoang ngay nho.
```

Uu tien trung binh:

```text
1. Tim dung endpoint return/refund detail de lay them Ngay ve kho neu API co.
2. Mapping return status -> Tinh trang xu ly noi bo.
3. Mapping cancel/refund/complaint chuan hon.
4. Test webhook thuc te.
5. Them API admin preview khong sync de xem raw/sample data.
```

Uu tien sau:

```text
1. Ma hoa token truoc khi luu DB.
2. Them auth/admin protection cho /admin endpoints.
3. Sentry/logging production.
4. Deploy len domain/VPS on dinh thay vi quick tunnel.
5. Viet test unit/e2e that.
```

## 16. Van de can luu y

### Quick tunnel

Cloudflare quick tunnel URL co the het hieu luc. Neu link khong vao duoc:

```powershell
cloudflared tunnel --url http://localhost:3000 --no-autoupdate
```

Lay URL moi, update:

```env
APP_BASE_URL=<new_url>
TIKTOK_REDIRECT_URI=<new_url>/tiktok/oauth/callback
```

Sau do update TikTok Partner Center redirect URL va restart backend.

### TikTok App/Seller Market

Da gap loi:

```text
Khong kha dung tai khu vuc cua cua hang ban
Ung dung hoac dich vu nay khong co san tren thi truong nguoi ban hien tai.
```

Nguyen nhan khong phai code. La do Partner Center market/seller/app status. Da xu ly trust/market de OAuth tiep tuc duoc.

### Ngay ve kho

Order API khong co.
Return/refund list page dau cung chua co.
Can tiep tuc tim endpoint hoac nguon logistics/warehouse de map chinh xac.

### Test hien tai

`npm.cmd run build` da pass sau khi sua Prisma adapter.

`npm test` truoc day khong co test.

`npm run test:e2e` truoc day loi vi test mau cu va ESM `uuid`.

Can sua test sau, chua uu tien bang luong sync.

## 17. Cach khoi dong lai local

1. Bat PostgreSQL va Redis:

```powershell
docker compose up -d
```

2. Dong bo schema DB:

```powershell
npx.cmd prisma db push
```

3. Build:

```powershell
npm.cmd run build
```

4. Chay backend:

```powershell
node dist\src\main.js
```

Neu can chay nen tren Windows:

```powershell
Start-Process -FilePath "node.exe" -ArgumentList "dist\src\main.js" -WorkingDirectory "D:\Tiktok" -WindowStyle Hidden
```

5. Tao tunnel neu can public URL:

```powershell
cloudflared tunnel --url http://localhost:3000 --no-autoupdate
```

6. Kiem tra:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/tiktok/oauth/redirect-url
node scripts\preview-tiktok-orders.mjs
```

## 18. De xuat buoc tiep theo phien sau

Lam theo thu tu nay de khong bi roi:

```text
Step 1: Sua src/modules/tiktok/tiktok-api.client.ts sang API 202309.
Step 2: Them method getAuthorizedShops(), cache/use shop_cipher.
Step 3: Insert/upsert shop GOODFIT Vietnam vao bang shops.
Step 4: Sua NormalizerService map theo cot Lark trong anh.
Step 5: Tao endpoint/admin preview chinh thuc neu can.
Step 6: Test sync 1 return/refund vao Lark Base.
Step 7: Test pagination va reconcile range nho.
```

Du lieu shop de upsert:

```text
platform: TIKTOK
shopId: 7494588178364533092
shopName: GOODFIT Vietnam
brand: GOODFIT
isActive: true
timezone: Asia/Ho_Chi_Minh
```

Can can nhac luu them `shop_cipher` vao DB. Schema `Shop` hien chua co field nay. Co 2 cach:

```text
Option A: Them field shopCipher vao Shop.
Option B: Moi lan call API goi /authorization/202309/shops de lay cipher.
```

Khuyen nghi: them `shopCipher` vao Shop de tranh goi thua.

## 19. Tinh trang tien do

Neu tinh rieng TikTok OAuth + doc du lieu:

```text
Khoang 80% xong.
```

Neu tinh ca luong TikTok -> Backend -> Normalize -> Lark Base auto:

```text
Khoang 45-50% xong.
```

Phan da chac chan:

```text
OAuth OK.
Token OK.
Authorized shop OK.
Order API OK.
Return/refund list API OK.
Mapping cot Lark ban dau OK.
```

Phan chua chac chan:

```text
Ngay ve kho.
Return detail endpoint.
Webhook thuc te.
Lark write thuc te.
Cron/reconcile voi API moi.
```
