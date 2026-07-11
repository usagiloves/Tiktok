# Update - Ke hoach sua map trang thai va Ngay ve kho

Cap nhat: 2026-07-09

Muc tieu cua file nay la chot ro nhung gi can lam de sua 2 van de dang gap:

1. Cot `Trang thai/TH - HT` tren Lark dang khong phan loai dung theo nghiep vu, nhieu record bi roi ve `Can kiem tra`.
2. Cot `Ngay ve kho` dang bi trong hoac day sai kieu du lieu / sai nguon du lieu.

File nay dung de implement theo tung buoc, tranh sua le te va tranh sua nham vao logic dang chay on dinh.

---

## 1. Tom tat van de hien tai

### 1.1. Van de map trang thai

Hien tai code dang map trang thai o:

- `src/modules/sync/status-mapper.service.ts`

Tinh trang hien tai:

- Order va Return/Refund dang dung 2 ham map rieng.
- Return/Refund co fallback ve `Can kiem tra` neu gap status la.
- Trong thuc te, TikTok co the tra ve nhieu bien the status khac nhau so voi bo key dang hardcode.
- Vi vay, nhieu record dang bi don ve `Can kiem tra` du status thuc te phai la:
  - `Chua ve kho`
  - `Tu choi`
  - `Da huy`
  - hoac nhom khac theo nghiep vu

He qua:

- Team kho / CSKH nhin Lark thay trang thai bi "det", khong phan biet duoc giai doan xu ly.
- Kho doi soat sai vi khong biet don dang o buoc nao.
- Khong debug duoc nhanh vi khong luu ro raw status nao da bi fallback.

### 1.2. Van de Ngay ve kho

Hien tai code dang tinh `Ngay ve kho` o:

- `src/modules/sync/normalizer.service.ts`

Tinh trang hien tai:

- Code dang uu tien:
  - `warehouse_receive_time`
  - `receive_time`
  - `return_completed_time`
  - `completed_time`
- Sau do format thanh chuoi `YYYY/MM/DD HH:mm`
- Neu co gia tri moi set:
  - `larkFields['Ngay ve kho'] = formatLarkDateTime(...)`

Van de co the dang xay ra:

1. TikTok list API khong tra ve cac field ngay kho trong phan lon case.
2. Lark cot `Ngay ve kho` co the dang la kieu `DateTime`, trong khi code dang gui `string`.
3. Co kha nang nguon du lieu dung cho nghiep vu "ve kho" khong nam o order list / return list ma o detail API.

He qua:

- Lark de trong cot `Ngay ve kho`.
- Team nghi he thong map sai dinh dang, trong khi thuc te co the la khong co data tu TikTok list API.

---

## 2. Nguyen nhan goc can chot

## 2.1. Nguyen nhan goc cua trang thai bi sai

Nguyen nhan kha nang cao nhat:

- Bo `RETURN_STATUS_MAP` hien tai chua bao phu het status thuc te TikTok dang tra ve.
- Code fallback:
  - status la -> `Can kiem tra`
- Nen he thong mat thong tin business.

Ngoai ra can luu y:

- `order.status`
- `line_items[].display_status`
- `line_items[].package_status`

la 3 lop thong tin khac nhau.

Khong duoc tron logic `order` va `return/refund` vao cung mot bo map.

## 2.2. Nguyen nhan goc cua Ngay ve kho bi trong

Can coi 3 kha nang rieng:

### Kha nang A - TikTok khong tra field ngay kho trong list API

Neu dung, thi:

- format dung hay sai khong quan trong
- vi ban than payload da khong co gia tri

### Kha nang B - Lark field type khong khop payload

Neu cot Lark la `DateTime` ma code gui chuoi text thi:

- Lark co the bo qua field
- hoac hien thi khong dung

### Kha nang C - Nghiep vu "Ngay ve kho" khong nen lay tu list API

Co the:

- chi nhung status da ve kho moi co du lieu
- va chi detail API moi tra gia tri do

Neu dung, can bo sung luong lay detail co chon loc.

---

## 3. Muc tieu sua

Sau khi sua xong, he thong phai dat duoc:

### 3.1. Ve trang thai

- Khong con tinh trang nhieu don bi don ve `Can kiem tra` chi vi status la.
- Phan loai dung cac nhom:
  - `Chua ve kho`
  - `Can kiem tra`
  - `Tu choi`
  - `Da huy`
  - cac trang thai order nhu `Dang giao`, `Da giao`, `Da huy`, `Cho xu ly van chuyen`
- Co the truy vet raw status khi can debug.

### 3.2. Ve Ngay ve kho

- Xac dinh duoc nguon du lieu chinh xac cho `Ngay ve kho`.
- Neu Lark can timestamp thi gui dung timestamp.
- Neu TikTok list API khong co du lieu thi khong format "doan".
- Neu can thi bo sung detail API co dieu kien de lay ngay kho.

---

## 4. Viec can lam - Bat buoc

## 4.1. Viec 1 - Tach ro logic map Order va Return/Refund

File lien quan:

- `src/modules/sync/status-mapper.service.ts`

Can lam:

1. Giu rieng:
   - `mapOrderStatus()`
   - `mapReturnStatus()`
2. Tuyet doi khong de return/refund dung chung fallback cua order.
3. Khong map `Cau chuyen kho` tu `order.status`.
4. Khong map `Trang thai hoan/tra` tu `orders_raw`.

Ket qua mong muon:

- Order chi ra cac trang thai order.
- Return/Refund chi ra cac trang thai return/refund.

## 4.2. Viec 2 - Bo sung lop normalize raw status truoc khi map

File lien quan:

- `src/modules/sync/status-mapper.service.ts`

Can lam:

Tao them 1 lop chuan hoa raw status, vi du:

- `BUYER_SHIPPED_ITEM` -> `BUYER_SHIPPED`
- `RETURN_OR_REFUND_REQUEST_COMPLETE` giu nguyen nhung dua vao nhom ket thuc
- `RECEIVED` -> `WAREHOUSE_RECEIVED_GROUP`
- `APPROVED` -> `WAREHOUSE_RECEIVED_GROUP`
- `REFUND_SUCCESS` -> `REFUND_SUCCESS_GROUP`

Khuyen nghi:

- Tach 2 buoc:
  1. `normalizeReturnStatusCode(rawStatus)`
  2. `mapNormalizedReturnStatus(normalizedStatus)`

Loi ich:

- De them status moi
- De debug
- Khong sua lung tung trong 1 map hardcode lon

## 4.3. Viec 3 - Khong dung `Can kiem tra` lam fallback mac dinh cho moi status la

File lien quan:

- `src/modules/sync/status-mapper.service.ts`

Can lam:

Thay vi:

- status la -> `Can kiem tra`

Nen doi thanh 1 trong 2 cach:

### Cach khuyen nghi

- status la -> `Chua phan loai`

Dieu kien:

- Lark phai co them option `Chua phan loai`

### Cach it thay doi hon

- van cho len `Can kiem tra`
- NHUNG bat buoc:
  - log raw status
  - ghi raw status vao note / payload de truy vet

Khuyen nghi cuoi cung:

- Neu team cho phep them option Lark -> dung `Chua phan loai`
- Neu khong -> tam thoi giu `Can kiem tra`, nhung phai co tracking raw status

## 4.4. Viec 4 - Luu raw status TikTok de debug

File lien quan:

- `src/modules/sync/normalizer.service.ts`
- `src/modules/sync/sync-engine.service.ts`

Can lam:

Bo sung vao `larkFields` hoac `payload` noi bo:

- `raw_order_status`
- `raw_return_status`
- `raw_package_statuses`
- `raw_display_statuses`

Khong nhat thiet day cac field nay len Lark neu khong can, nhung it nhat phai luu trong DB payload.

Loi ich:

- Sau nay chi can query DB la biet TikTok da tra status gi.
- De bo sung map ma khong can doan.

## 4.5. Viec 5 - Kiem tra kieu cot `Ngay ve kho` tren Lark

Bat buoc xac minh:

- Cot `Ngay ve kho` la `Text` hay `DateTime`

Neu la `Text`:

- Co the tiep tuc gui `YYYY/MM/DD HH:mm`

Neu la `DateTime`:

- Phai sua payload gui sang dung kieu Lark yeu cau
- Tuyet doi khong gui string text tu formatter hien tai

Day la buoc bat buoc, neu khong moi sua format deu co the sai.

## 4.6. Viec 6 - Xac minh TikTok list API co that su tra ngay kho hay khong

Can lam:

1. Lay 1 vai record return/refund da biet chac da ve kho.
2. In raw payload.
3. Kiem tra co cac field sau khong:
   - `warehouse_receive_time`
   - `receive_time`
   - `return_completed_time`
   - `completed_time`

Neu khong co:

- Ket luan list API khong du cho `Ngay ve kho`

Khi do:

- Khong duoc tiep tuc ky vong normalizer tu list API se day du lieu nay

## 4.7. Viec 7 - Chi goi detail API cho nhom can lay Ngay ve kho

File lien quan:

- `src/modules/tiktok/tiktok-api.client.ts`
- `src/modules/reconcile/reconcile.service.ts`
- `src/modules/sync/sync-engine.service.ts`

Can lam:

Chi bo sung request detail cho cac return/refund thuoc nhom:

- `WAREHOUSE_RECEIVED`
- `RECEIVED`
- `APPROVED`
- `REFUND_SUCCESS`
- `RETURN_OR_REFUND_REQUEST_COMPLETE`

Khong goi detail cho tat ca record vi quota request bi gioi han.

Logic de xuat:

1. List API tra record
2. Neu status thuoc nhom "co kha nang co ngay kho"
3. Va `warehouseReceivedAt` dang null
4. Thi moi goi detail API

Loi ich:

- Toi uu request
- Van lay duoc ngay kho cho record quan trong

---

## 5. Viec can lam - Nen lam ngay sau do

## 5.1. Ghi chu he thong ro hon cho don huy

Trong order raw, `CANCELLED` co the do:

- Buyer huy
- System huy
- Giao that bai

De xuat:

- Cot `Trang thai/TH - HT` van la `Da huy`
- `Ghi chu he thong` them:
  - `Huy boi BUYER - Khong con nhu cau`
  - `Huy boi SYSTEM - Giao goi hang that bai`

Nhu vay Lark van sach ma van du nghiep vu.

## 5.2. Gop package status / display status de debug order

Trong order raw, co:

- `status`
- `line_items[].display_status`
- `line_items[].package_status`

Can luu tong hop:

- danh sach package status duy nhat
- danh sach display status duy nhat

Vi du:

- `rawPackageStatuses = ['COMPLETED']`
- `rawDisplayStatuses = ['DELIVERED']`

Luu vao payload DB de sau nay co can mo rong map thi co san du lieu.

## 5.3. Them log warning co cau truc

Hien tai warning dang o dang text don.

Nen nang cap de log ro:

- `syncKey`
- `requestType`
- `rawStatus`
- `normalizedStatus`
- `fallbackUsed`

De sau nay grep log nhanh hon.

---

## 6. Thu tu trien khai khuyen nghi

Nen lam theo dung thu tu nay:

### Buoc 1

Doc va tong hop raw status thuc te tu TikTok:

- order statuses
- return/refund statuses
- package statuses
- display statuses

Muc tieu:

- co bo raw status that, khong doan theo tai lieu

### Buoc 2

Sua `status-mapper.service.ts`:

- tach normalize status
- tach map order / return
- bo fallback cung
- bo sung log raw status la

### Buoc 3

Cap nhat `normalizer.service.ts`:

- luu raw status vao payload
- bo sung note ro hon cho don huy
- xu ly `Ngay ve kho` theo dung nguon va dung type

### Buoc 4

Kiem tra field type tren Lark:

- `Ngay ve kho`
- neu can, sua client payload gui len Lark

### Buoc 5

Neu list API khong co ngay kho:

- bo sung detail fetch co dieu kien

### Buoc 6

Build va test lai tren 1 tap record thuc:

- 1 don `DELIVERED`
- 1 don `COMPLETED`
- 1 don `CANCELLED`
- 1 return `BUYER_SHIPPED`
- 1 return `WAREHOUSE_RECEIVED`
- 1 return `REFUND_SUCCESS`

---

## 7. Mapping de xuat hien tai

## 7.1. Order status

Map de xuat:

- `UNPAID` -> `Chua thanh toan`
- `ON_HOLD` -> `Dang giu don`
- `AWAITING_SHIPMENT` -> `Cho xu ly van chuyen`
- `AWAITING_COLLECTION` -> `Cho don vi van chuyen lay hang`
- `IN_TRANSIT` -> `Dang giao`
- `DELIVERED` -> `Da giao`
- `COMPLETED` -> `Da giao`
- `CANCELLED` -> `Da huy`

Ghi chu:

- `COMPLETED` khong auto nhay sang `Hoan tat`
- `Hoan tat` neu co la trang thai nghiep vu noi bo do team kho xu ly tay

## 7.2. Return/Refund status

Map de xuat theo nghiep vu hien tai:

- `RETURN_REQUESTED` -> `Chua ve kho`
- `SELLER_REVIEWING` -> `Chua ve kho`
- `AWAITING_BUYER_SHIP` -> `Chua ve kho`
- `BUYER_SHIPPED` -> `Chua ve kho`
- `BUYER_SHIPPED_ITEM` -> `Chua ve kho`
- `RETURN_IN_TRANSIT` -> `Chua ve kho`
- `SHIPPED_BACK` -> `Chua ve kho`
- `PENDING` -> `Chua ve kho`
- `PROCESSING` -> `Chua ve kho`

- `WAREHOUSE_RECEIVED` -> `Can kiem tra`
- `RECEIVED` -> `Can kiem tra`
- `APPROVED` -> `Can kiem tra`
- `REFUND_SUCCESS` -> `Can kiem tra`
- `RETURN_OR_REFUND_REQUEST_COMPLETE` -> `Can kiem tra`

- `REQUEST_REJECTED` -> `Tu choi`
- `REJECTED` -> `Tu choi`

- `CANCELLED` -> `Da huy`

Fallback:

- Khuyen nghi: `Chua phan loai`
- Neu chua them duoc option tren Lark: `Can kiem tra` + log raw status bat buoc

---

## 8. Phuong an xu ly Ngay ve kho

## 8.1. Neu cot Lark la Text

Thi payload co the la:

- `YYYY/MM/DD HH:mm`

Khi do can sua:

- chi day field khi co du lieu that
- khong day chuoi rong

## 8.2. Neu cot Lark la DateTime

Thi can:

- gui dung timestamp / format Lark API yeu cau
- bo formatter text cho field nay

Luu y:

- co the van giu formatter text cho `Ngay tao don` neu cot do dang la text
- nhung `Ngay ve kho` phai di theo type that cua cot

## 8.3. Neu TikTok list API khong co ngay kho

Thi:

- khong ket luan la code format sai
- phai bo sung detail API co chon loc

## 8.4. Neu detail API van khong co ngay kho

Thi phai chot nghiep vu:

- co chap nhan de trong `Ngay ve kho` khong
- hay dung 1 moc thay the, vi du:
  - `thoi diem TikTok chuyen sang WAREHOUSE_RECEIVED`

Khuyen nghi:

- neu business bat buoc can "ngay kho thuc te", can xac minh nguon nay co that trong TikTok khong
- neu TikTok khong tra, khong nen fake du lieu

---

## 9. File can sua

Bat buoc:

- `src/modules/sync/status-mapper.service.ts`
- `src/modules/sync/normalizer.service.ts`
- `src/modules/sync/sync-engine.service.ts`

Co the can sua them:

- `src/modules/tiktok/tiktok-api.client.ts`
- `src/modules/reconcile/reconcile.service.ts`
- `src/modules/lark/lark-api.client.ts`
- `src/modules/lark/lark-record.service.ts`

Neu can doi payload DateTime cho Lark:

- uu tien kiem tra `lark-api.client.ts`

---

## 10. Checklist xac nhan sau khi sua

## 10.1. Checklist trang thai

- [ ] Order `DELIVERED` len Lark la `Da giao`
- [ ] Order `COMPLETED` len Lark la `Da giao`
- [ ] Order `CANCELLED` len Lark la `Da huy`
- [ ] Return `BUYER_SHIPPED` len Lark la `Chua ve kho`
- [ ] Return `BUYER_SHIPPED_ITEM` len Lark la `Chua ve kho`
- [ ] Return `WAREHOUSE_RECEIVED` len Lark la `Can kiem tra`
- [ ] Return `REFUND_SUCCESS` len Lark la `Can kiem tra`
- [ ] Return `REQUEST_REJECTED` len Lark la `Tu choi`
- [ ] Status la khong bi roi am tham ve `Can kiem tra` ma khong co log

## 10.2. Checklist ngay ve kho

- [ ] Xac minh duoc field type cua `Ngay ve kho` tren Lark
- [ ] Neu Lark la DateTime, payload da gui dung type
- [ ] Record co `warehouse_receive_time` thi Lark hien dung gia tri
- [ ] Record khong co ngay kho thi de trong, khong fake
- [ ] Co it nhat 1 record thuc da ve kho duoc day dung

## 10.3. Checklist debug

- [ ] DB payload luu duoc raw status
- [ ] Co log warning khi gap status la
- [ ] Co the truy vet 1 sync_key xem TikTok tra ve raw status nao

---

## 11. Rủi ro can tranh

1. Khong sua map bang cach them tay tung key ma khong luu raw status
   - Se tiep tuc bi sua chay theo loi.

2. Khong sua `Ngay ve kho` chi bang doi formatter
   - Neu API khong co data thi doi format cung vo ich.

3. Khong dung detail API cho tat ca record
   - Se ton request rat nhanh.

4. Khong doi `COMPLETED` cua order thanh `Hoan tat`
   - Team da chot day la trang thai tay noi bo.

5. Khong tron logic order va return/refund
   - Day la nguon goc cua viec map sai nghiep vu.

---

## 12. Ke hoach thuc hien de xuat

### Phase 1 - Khao sat nhanh

- Kiem tra raw status thuc te
- Kiem tra type cot `Ngay ve kho`
- Kiem tra record nao da ve kho ma dang trong

### Phase 2 - Sua logic

- Sua `status-mapper.service.ts`
- Sua `normalizer.service.ts`
- Sua payload luu raw status

### Phase 3 - Sua luong ngay ve kho

- Neu can thi sua payload Lark
- Neu can thi bo sung detail fetch co dieu kien

### Phase 4 - Build va doi soat

- `npm.cmd run build`
- test tren 1 lo record thuc
- doi soat Lark

---

## 13. Ket luan

Hai van de hien tai khong nen sua theo kieu "doan" nhanh:

- Van de `Trang thai/TH - HT` can sua theo huong:
  - tach order / return
  - normalize raw status
  - bo fallback cung
  - luu raw status de debug

- Van de `Ngay ve kho` can sua theo huong:
  - xac minh type field tren Lark
  - xac minh TikTok co tra du lieu hay khong
  - neu can thi chi goi detail cho nhom status lien quan den kho

Neu lam dung theo file nay, he thong se:

- map trang thai dung hon theo nghiep vu
- giam tinh trang don bi gom ve `Can kiem tra`
- xac dinh dung ly do `Ngay ve kho` bi trong
- tranh ton request khong can thiet
