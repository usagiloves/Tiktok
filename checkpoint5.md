# Checkpoint 5 - TikTok / Shopee Sync Status

Cap nhat: 2026-07-10 17:13:23

File nay duoc tao de tiep tuc phien lam viec tiep theo ma khong can doc lai toan bo code va history chat.

---

## 1. Trang thai tong quan

Du an hien co 2 nhanh nghiep vu chinh:

- TikTok -> Lark Base
- Shopee -> Lark Base

TikTok da chay production va dang co cron / webhook / reconcile / sync Lark that.

Shopee dang trong giai doan hoan thien logic nghiep vu va doi chieu implementation, dac biet o:

- order filter
- return detail mapping
- `Ngay ve kho`
- `Ngay tao don`
- tinh dong nhat voi logic TikTok

---

## 2. Ket luan quan trong ve TikTok hien tai

### A. Cron / runtime

Da xac minh truc tiep tren VPS:

- API container dang chay
- `/health` tra `ok`
- cron dang chay that
- `sync_logs` co record `source = CRON`
- `lark_records` co record moi duoc update

Ket luan:

- TikTok cron co chay
- TikTok co do du lieu sang Lark

### B. Logic filter orders cua TikTok

`reconcileOrders()` hien tai dang filter rat chat:

- chi xet order co `status = CANCELLED`
- loai bo:
  - buyer cancel
  - seller cancel
- chi giu lai nhom duoc xem la:
  - giao hang that bai
  - logistics failure

Noi dung nay nam o:

- `src/modules/reconcile/reconcile.service.ts`

Nghia la:

- don dang giao -> khong lay vao Lark qua cron orders
- don binh thuong -> khong lay
- khach huy -> khong lay
- seller huy thong thuong -> khong lay
- giao hang that bai -> lay

### C. Logic returns cua TikTok

`reconcileReturns()` lay du lieu day du hon orders:

- quet theo `update_time`
- group theo request type
- sync theo return / refund / cancel / complaint

### D. Logic `Ngay ve kho` cua TikTok

Hien tai code TikTok dung Option B:

1. Uu tien timestamp kho that neu API co:
   - `warehouse_receive_time`
   - `receive_time`
   - `return_completed_time`
   - `completed_time`
2. Neu khong co, nhung `internalStatus = Can kiem tra`
   - fallback `Ngay ve kho = update_time`

Nghia la:

- khong hoan toan doi kho bam xac nhan moi co ngay
- code hien tai dang dung "best available operational timestamp"

---

## 3. Ket luan quan trong ve Shopee hien tai

### A. Huong nghiep vu da chot

Shopee phai di theo logic TikTok, khong di theo huong "lay rong" nua.

Cu the:

- orders: filter gat giong TikTok
- returns/refunds: van sync rieng vi day la nghiep vu sau ban

### B. Van de implementation lon nhat hien tai

Shopee orders hien tai **chua on**.

Ly do:

- `reconcileShopeeOrders()` goi `syncOrdersBatch(...)`
- nhung khong truyen `platform: 'SHOPEE'`
- `sync-engine.service.ts` chi route sang `normalizeShopeeOrder()` neu `shopMeta.platform === 'SHOPEE'`

Do do:

- Shopee order co the bi dua nham vao `normalizeOrder()` cua TikTok
- gay ra cac loi logic:
  - doc sai field (`order_id` vs `order_sn`)
  - `sync_key` sai
  - `platform` sai
  - `Kenh ban` sai
  - output Lark sai

Day la issue uu tien cao nhat can sua.

### C. Trang thai Shopee returns

Shopee returns/refunds hien tai o muc kha on:

- `reconcileShopeeReturns()` co lay list
- co goi detail `getReturnDetail()`
- co route dung sang `normalizeShopeeReturn()` vi da truyen `platform: 'SHOPEE'`

Mapping voi file mau `shopee-return-full.json` nhin chung hop ly:

- `order_sn` -> `Ma don goc`
- `return_sn` -> `Ma don tra`
- `status` -> `Trang thai/TH - HT`
- `needs_logistics` -> `Don THHT` / `Hoan tien`
- `update_time` -> fallback `Ngay ve kho`

### D. Van de `Ngay tao don` ben Shopee return

`normalizeShopeeReturn()` hien tai de:

- `orderCreatedAt = null`

Sau do `SyncEngine` moi lookup order goc trong `normalized_requests` de backfill.

Nghia la:

- neu order Shopee da co trong DB -> return co the dien duoc `Ngay tao don`
- neu chua co -> return se thieu field nay

Day la expected behavior voi implementation hien tai, nhung can nho de test.

---

## 4. Ket qua danh gia chat luong code hien tai

### A. Dev TikTok

Danh gia tong quan:

- rat thuc chien
- co tu duy nghiep vu va van hanh
- hieu bang Lark la bang xu ly nghiep vu, khong phai data lake
- biet reconcile, idempotency, sync key, batch upsert, status mapping

Diem manh:

- business thinking tot
- system thinking tot
- code giai quyet duoc bai toan production that

Diem yeu:

- logic nghiep vu nam rai rac
- cron va webhook chua dong nhat 100%
- co mot so workaround production chua duoc dong goi abstraction dep

### B. Muc danh gia implementation

Xep hang cam tinh:

- system thinking: 8/10
- business implementation: 8/10
- code cleanliness / maintainability: 6.5/10

---

## 5. Tai lieu da tao trong phien nay

Da tao cac file huong dan phuc vu trien khai Shopee:

- `readmeshopee.md`
  - huong dan tong quan de trien khai Shopee theo cung normalized model nhu TikTok

- `readmedatevekho.md`
  - mo ta Option B cho `Ngay ve kho`
  - uu tien warehouse timestamp that
  - fallback `update_time` khi status du manh

- `readmefilter.md`
  - da cap nhat lai theo huong moi
  - Shopee phai filter gat giong TikTok
  - orders chi giu nhom failed delivery / logistics failure

---

## 6. Cac phat hien nghiep vu quan trong da chot

### A. `ID_SHOP`

Da xac dinh:

- `ID_SHOP` phai lay tu `shopCode`
- vi du shop dung can la `VNLC6WWLQL`
- khong dung `shopId` noi bo de hien thi field nay tren Lark

Da sua code theo huong:

- them `shopCode` vao `Shop`
- upsert shop tu `authorized shops.code`
- `ID_SHOP = shopCode || shopId`

### B. `Ngay ve kho`

Da thao luan 2 huong:

- nghia mem: moc API / last meaningful update
- nghia cung: kho xac nhan thuc nhan

Code TikTok hien tai dang theo huong Option B:

- neu co moc kho that thi dung
- neu khong co va status da vao nhom manh thi fallback `update_time`

### C. Filter order

Da chot:

- Shopee khong di theo wide intake nua
- Shopee phai filter gat giong TikTok orders

---

## 7. Cac viec dang dung o giua duong

### A. Shopee order normalizer routing bug

Can sua ngay:

- o `reconcileShopeeOrders()`
- khi goi `syncOrdersBatch(...)`
- phai truyen:

```ts
{ shopId: shop.shopId, brand, shopCode, platform: 'SHOPEE' }
```

Neu khong:

- order Shopee se bi normalizer TikTok xu ly nham

### B. Xac minh raw payload Shopee order detail that

Can xac minh tren payload thuc:

- `cancel_by`
- `cancel_reason`
- `order_status`

de biet filter:

- `BUYER`
- `SELLER`
- `LOGISTICS`

co dung gia tri thuc te cua Shopee shop nay hay khong.

### C. Xac minh `Ngay tao don` cho Shopee returns

Can test:

- khi order goc da co trong DB
- khi order goc chua co trong DB

de xem return co backfill duoc `Ngay tao don` chua.

---

## 8. Danh sach viec can lam tiep ngay mai

Uu tien theo thu tu:

1. Sua bug `platform: 'SHOPEE'` cho `reconcileShopeeOrders()`
2. Test 1-3 order Shopee that de xac minh:
   - order co di dung `normalizeShopeeOrder()` khong
   - `sync_key` dung khong
   - `Kenh ban = Shopee`
   - `Ma don goc = order_sn`
3. Test raw payload Shopee order detail de xac minh filter:
   - buyer cancel
   - seller cancel
   - logistics failure
4. Test 1-3 return Shopee that voi:
   - `needs_logistics = true`
   - refund only
   - cancelled request
5. Kiem tra `Ngay tao don` ben return co backfill duoc tu order goc khong
6. Neu on thi moi deploy / verify tren VPS

---

## 9. Cach tu duy tiep theo cho Shopee

Nguyen tac:

- khong sang tac them business rule moi neu TikTok da co rule tuong duong
- uu tien copy tinh than TikTok:
  - order filter gat
  - return sync rieng
  - `Ngay ve kho` theo Option B
  - `ID_SHOP` theo `shopCode`
  - `Ngay tao don` uu tien order goc

Shopee nen duoc xem la:

- mot adapter khac cua cung he thong normalized business model

khong phai mot he thong logic rieng.

---

## 10. Canh bao de nho

### A. Build pass != logic dung

`npm run build` da pass, nhung:

- Shopee orders van co the sai logic runtime

### B. Webhook va cron TikTok chua dong nhat tuyet doi

Cron orders TikTok filter chat, nhung webhook order co the vao rong hon.

Neu sau nay can dong nhat 100% TikTok thi phai xem lai webhook order flow.

### C. Shopee docs chua verify 100% bang source official trong phien nay

Mot so assumption filter dang dua tren:

- payload that
- naming convention thuong gap cua Shopee

Can xac minh tren raw response thuc te cua shop truoc khi chot production.

---

## 11. Kết luận ngắn

Trang thai hien tai:

- TikTok production logic da duoc hieu ro
- Shopee return dang di dung huong
- Shopee order con 1 bug logic lon va can test payload that
- Tai lieu trien khai da duoc tao day du de tiep tuc ngay mai

Neu vao phien tiep theo, viec dau tien can lam la:

```text
Sua route normalizer cho Shopee orders + test 1 order Shopee that
```
