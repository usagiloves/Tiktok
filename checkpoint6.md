# Checkpoint 6 - J&T / Shopee / TikTok Return Flow

Cap nhat: 2026-07-11

File nay duoc tao de tiep tuc phien lam viec sau ma khong can doc lai toan bo chat history.

---

## 1. Muc tieu va pham vi hom nay

Hom nay tap trung vao 4 nhom viec chinh:

- doi chieu logic Shopee voi payload API that
- chot nghiep vu `Ngay ve kho` va `TH-HT`
- thiet ke va review tich hop J&T Express
- kiem tra code sau khi da sua

---

## 2. Ket luan nghiep vu da chot

### A. Logic `Ngay ve kho`

Nghiep vu da chot theo huong giong TikTok:

1. Neu san / API co moc kho that thi uu tien dung moc do
2. Neu don da bi cat khoi API sau khi xac nhan nhan hang hoan, co the dung `lan cap nhat API cuoi cung`
3. Muc dich cua cot nay la de kho kiem soat tiep, khong phai thay the thao tac kiem hang that

Ket luan quan trong:

- Ben he thong chi can dien `Ngay ve kho` khi co du lieu hop ly nhat hien co
- Phan "con hang hay khong" la viec cua kho, khong phai viec cua sync system

### B. Logic `TH-HT` cho don giao hang that bai

Rule cuoi cung da chot:

- **Chua co `Ngay ve kho`** -> `TH-HT = Dang hoan`
- **Vua co `Ngay ve kho`** -> `TH-HT = Can kiem tra`

Luu y:

- Cot `Loai yeu cau` da the hien nghiep vu nhu `Giao hang that bai`
- Cot `TH-HT` chi dong vai tro trang thai xu ly cua he thong
- Khong can dat them logic phuc tap khac cho `TH-HT`

### C. Lark option

Neu Lark chua co option `Dang hoan` thi system se khong day dung gia tri nay duoc.

Can dam bao bang Lark co san option:

- `Dang hoan`
- `Can kiem tra`

---

## 3. Doi chieu payload Shopee

Da doi chieu logic voi file:

- `shopee-return-full.json`

Ket luan:

- Huong mapping Shopee return la dung tong the
- `Ngay tao don` cua return khong nen lay tu thoi diem tao yeu cau return, ma uu tien lay tu order goc
- `needs_logistics = true` hop ly de xep nhom `Don THHT`
- `update_time` duoc phep dung lam fallback `Ngay ve kho` khi nghiep vu da vao nhom can kiem tra

Mot ghi chu da tung flag trong review:

- voi Shopee return, `text_reason` thuong co gia tri nghiep vu tot hon `reason`, can uu tien neu payload thuc te cho thay nhu vay

---

## 4. Phuong an J&T da chot

Muc tieu cua J&T trong he thong nay rat hep:

- chi phuc vu nghiep vu don huy / giao hang that bai
- chi de bo sung `Ngay ve kho`
- khong bien J&T thanh nguon trang thai chinh

### A. Vai tro cua J&T

J&T chi la nguon enrich:

- doc hanh trinh van don
- tim moc hop ly nhat de xem hang da quay ve
- neu tim thay thi do vao `Ngay ve kho`
- sau do `TH-HT` nhay sang `Can kiem tra`

### B. Thu tu uu tien nguon du lieu

Thu tu uu tien nghiep vu:

1. marketplace warehouse timestamp that
2. moc tra ve hop ly tu J&T
3. fallback `update_time` cua marketplace neu nghiep vu da cho phep

### C. Cau hinh J&T da chot

Da chot base URL production:

- `https://ylopenapi.jtexpress.vn/webopenplatformapi/api/logistics/trace`

Thong tin can co de chay that:

- `JT_API_BASE_URL`
- `JT_API_ACCOUNT`
- `JT_CUSTOMER_CODE`
- `JT_PASSWORD`
- `JT_PRIVATE_KEY`
- `JT_ENABLED`

### D. Tai lieu da cap nhat

Da cap nhat file:

- `readmejt.md`

Noi dung da bo sung trong file nay:

- phuong an tich hop J&T
- pham vi su dung
- luong xu ly nghiep vu
- rule `TH-HT`
- thu tu uu tien nguon du lieu
- luu y production

---

## 5. Nhung bug / rui ro da review trong code

Trong qua trinh review, da tung phat hien 4 van de chinh:

### A. Shopee return `sync_key` sai `requestType`

Van de cu:

- build `sync_key` bang `RETURN`
- nhung requestType that co the la `REFUND`, `CANCEL`, hoac `RETURN`

Neu khong sua:

- record de bi de nham
- chong trung sai
- retry sai target

### B. Batch backfill `Ngay tao don` co nguy co lay nham order goc

Van de cu:

- query order goc theo `orderId`
- nhung khong filter chat theo `platform` va `shopId`

Neu khong sua:

- return cua shop nay co the lay nham `Ngay tao don` cua shop khac

### C. `orderCreatedAt` khong duoc cap nhat tren nhanh update

Van de cu:

- create thi co luu
- update thi khong luu lai `orderCreatedAt`

Neu khong sua:

- DB co the van null du payload / Lark da co gia tri

### D. Parse thoi gian J&T khong on dinh

Van de cu:

- dung truc tiep `new Date('YYYY-MM-DD HH:mm:ss')`

Neu khong sua:

- co the loi parse
- sai timezone
- sinh `Invalid Date`

---

## 6. Trang thai code sau khi da sua

Da review lai code sau khi user bao "da sua xong".

Ket luan:

### A. Da sua dung

1. Shopee return da build `sync_key` theo `requestType` that
2. `orderCreatedAt` da duoc cap nhat lai tren nhanh `update`
3. Batch backfill da dung composite key de tranh nham shop / platform
4. J&T mapper da co helper parse thoi gian thay vi parse tho
5. Logic `TH-HT` cho don giao hang that bai da len dung rule:
   - chua co `Ngay ve kho` -> `Dang hoan`
   - co `Ngay ve kho` -> `Can kiem tra`

### B. Van con 1 rui ro nho

Trong `jt-express.mapper.ts`, helper parse date dang co huong:

- neu chuoi thoi gian rong / loi -> tra `new Date()`

Rui ro:

- neu payload loi, system co the vo tinh sort theo "thoi diem hien tai"
- xau hon la co the gan nham `Ngay ve kho`

Khuyen nghi:

- nen doi sang `new Date(NaN)` hoac `null`
- bo qua event loi thay vi thay bang thoi gian hien tai

Day la mot rui ro nho, khong phai blocker lon nhu 4 loi truoc.

---

## 7. Kiem tra build

Da chay:

- `npm.cmd run build`

Ket qua:

- build pass

Luu y:

- co luc `npm run build` bi chan boi PowerShell execution policy
- dung `npm.cmd run build` thi chay duoc binh thuong

---

## 8. Danh gia trang thai he thong hien tai

### A. Phan dang on

- TikTok sync flow
- Shopee return flow
- rule `Ngay ve kho`
- rule `TH-HT`
- wiring module J&T
- batch sync / batch upsert flow

### B. Phan da du dieu kien de test production

- enrich J&T cho don giao hang that bai / don huy
- day `Ngay ve kho` len Lark
- doi `TH-HT` theo `Ngay ve kho`

### C. Phan can de y them

- Lark phai co option `Dang hoan`
- can test payload J&T that de chac chan event code / event text khop voi shop dang dung
- can theo doi 1 vai record production dau tien de xac minh `Ngay ve kho` khong bi dien nham

---

## 9. Goc nhin kien truc

Da thong nhat cach goi he thong:

- phu hop hon voi ten `automation service`
- hoac `reconciliation bot`
- khong nen goi la AI agent theo nghia chat

Ly do:

- he thong hien tai chu yeu chay theo rule co dinh
- goi API -> normalize -> map status -> sync Lark
- chua co phan tu suy luan mo hoac tu lap ke hoach nhu mot AI agent dung nghia

### A. Service nao khong nen thay bang agent

Khong nen agent hoa cac thanh phan sau:

- `TikTokApiClient`
- `ShopeeApiClient`
- `JtExpressClient`
- `LarkRecordService`
- `NormalizerService`
- `StatusMapperService`
- DB / Prisma access layer
- Scheduler / Worker / Cron

Nhung phan nay can:

- deterministic
- de audit
- de debug
- on dinh production

### B. Nen them agent o dau neu nang cap sau nay

Vi tri hop ly nhat:

- tren lop `ReconcileService`

Tu duy dung:

- service hien tai van giu nguyen
- agent dung o tang quyet dinh
- agent goi cac service ben duoi

### C. Model nao hop ly neu them agent

Neu sau nay co tang agent that, lua chon hop ly nhat la:

- `gpt-5.6-terra`

Ly do:

- can reasoning nhieu buoc
- can can bang chi phi va chat luong
- phu hop workflow doi soat / quyet dinh / giai thich

Khi can case kho hon:

- escalate len `gpt-5.6-sol`

Khi can xu ly re / khoi luong lon:

- dung `gpt-5.6-luna`

---

## 10. Viec da lam hom nay

Danh sach tong hop:

1. Doc va doi chieu file API Shopee return mau
2. Chot nghiep vu `Ngay ve kho` theo logic van hanh that
3. Chot rule cuoi cung cho `TH-HT`
4. Huong dan cau hinh J&T production
5. Cap nhat `readmejt.md` thanh tai lieu phuong an phat trien bang tieng Viet
6. Review implementation J&T trong code
7. Chi ra 4 loi/rui ro chinh trong code
8. Review lai sau khi user sua xong
9. Xac nhan phan lon da sua dung
10. Build lai thanh cong
11. Tra loi them ve kien truc service vs agent de user dinh huong sau nay

---

## 11. Viec can lam tiep neu muon kin hon

Uu tien de xuat:

1. Sua not helper parse date cua J&T de khong fallback `new Date()`
2. Test 3-5 van don J&T that co hanh trinh return
3. Xac minh Lark co san option `Dang hoan`
4. Theo doi 1 dot reconcile production de kiem tra:
   - `Ngay ve kho`
   - `TH-HT`
   - `Loai yeu cau`
5. Neu on dinh thi moi xem xet viet them lop agent o tang `Reconcile`

---

## 12. Ket luan ngan

Trang thai cuoi ngay:

- nghiep vu da ro
- tai lieu da cap nhat
- J&T da duoc tich hop dung huong
- cac loi lon da duoc sua
- he thong da build pass

Noi dung con lai chu yeu la:

- lam kin 1 rui ro nho o parse date J&T
- test production that
- theo doi chat luong du lieu tren Lark

