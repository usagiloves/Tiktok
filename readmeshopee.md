# Shopee Return/Refund Sync Implementation Guide

## Goal

Implement the Shopee module so that Shopee order and return/refund data are normalized into the same Lark structure already used by TikTok.

The objective is not to mirror Shopee raw API fields directly in Lark, but to convert Shopee data into the same internal business shape used by the TikTok module.

---

## Target Lark Output

Every synced Shopee record should fit the same business table structure:

- `Ngày về kho`
- `Kênh bán`
- `Thương hiệu`
- `Mã đơn gốc`
- `Mã đơn trả`
- `Ngày tạo đơn`
- `Loại yêu cầu`
- `Trạng thái/TH - HT`
- `ID_SHOP`

Recommended fixed values:

- `Kênh bán` = `Shopee`
- `ID_SHOP` = `shopCode || shopId`

---

## Core Design Principle

Shopee should follow the same logic as TikTok:

1. Order flow and return/refund flow are handled separately.
2. Return/refund records are linked to the original order.
3. All platform-specific payloads are transformed into one common normalized shape.
4. Lark receives business-ready values, not raw marketplace values.

This means Shopee should reuse the same internal concepts already used by TikTok:

- `sync_key`
- `requestType`
- `internalStatus`
- `orderCreatedAt`
- `warehouseReceivedAt`
- `lastTiktokUpdateTime` equivalent field for update tracking

---

## Data Model Strategy

### Orders

Shopee orders should behave like TikTok orders:

- one record per original order
- `requestType = ORDER`
- `Mã đơn gốc = order_sn`
- `Mã đơn trả = empty`

### Returns / Refunds

Shopee return/refund records should behave like TikTok after-sale requests:

- one record per return/refund request
- linked to the original order using `order_sn`
- `Mã đơn gốc = order_sn`
- `Mã đơn trả = return_sn`
- `requestType` should distinguish return-like and refund-only behavior if needed

Recommended sync key pattern:

```text
SHOPEE_{shopId}_{brand}_{orderSn}_{requestType}_{returnSn-or-ONLY}
```

Important:

- keep `shopId` inside `sync_key`
- use `shopCode` only for display fields like `ID_SHOP`

---

## API Strategy

### Order Sync

Recommended flow:

1. Call `get_order_list` using `update_time`
2. Collect `order_sn`
3. Call `get_order_detail`
4. Normalize and upsert

### Return / Refund Sync

Recommended flow:

1. Call `get_return_list` using `time_from` / `time_to`
2. Collect each `return_sn`
3. Fetch detail payload for each return/refund request
4. Normalize and upsert

Reason:

The list endpoint is useful for scanning changes, but detail payloads are required for reliable business mapping.

---

## Mapping Rules

### 1. Common Display Fields

| Lark Field | Shopee Source | Rule |
|---|---|---|
| `Kênh bán` | fixed | `Shopee` |
| `Thương hiệu` | shop config | use internal shop brand |
| `ID_SHOP` | `shopCode` or `shopId` | use `shopCode || shopId` |

### 2. Order Fields

| Lark Field | Shopee Source | Rule |
|---|---|---|
| `Mã đơn gốc` | `order_sn` | direct mapping |
| `Mã đơn trả` | none | empty |
| `Ngày tạo đơn` | `order.create_time` | original order creation time |
| `Loại yêu cầu` | order status/business rule | usually `Đơn hàng` or `Đơn huỷ` |
| `Trạng thái/TH - HT` | `order_status` | map through internal order status map |

### 3. Return / Refund Fields

| Lark Field | Shopee Source | Rule |
|---|---|---|
| `Mã đơn gốc` | `order_sn` | direct mapping |
| `Mã đơn trả` | `return_sn` | direct mapping |
| `Ngày tạo đơn` | order create time | must come from original order, not return create time |
| `Loại yêu cầu` | return type | map to `Đơn THHT`, `Hoàn tiền`, or `Đơn huỷ` |
| `Trạng thái/TH - HT` | `status` | map through internal Shopee return status map |
| `Ngày về kho` | reverse logistics milestone | use best available warehouse/returned milestone |

---

## Important Business Rules

### Rule 1: `Ngày tạo đơn` must come from the original order

Do not use return `create_time` as `Ngày tạo đơn`.

Use:

- order detail `create_time`, or
- previously synced `ORDER` record from `normalized_requests`

This keeps Shopee behavior aligned with TikTok.

### Rule 2: Return status must be converted into internal business statuses

Do not write raw Shopee values like:

- `REQUESTED`
- `REFUND_PAID`
- `CLOSED`

directly into `Trạng thái/TH - HT`.

Map them to the same internal labels used by TikTok:

- `Chưa về kho`
- `Cần kiểm tra`
- `Từ chối`
- `Đã huỷ`

### Rule 3: `Ngày về kho` should represent the best warehouse-return milestone available

Recommended priority:

1. explicit warehouse-arrival field if Shopee provides one
2. reverse logistics delivered/completed timestamp if available
3. fallback to `update_time` only if business has accepted this approximation

### Rule 4: Return/refund records must not overwrite original order records

Each request must have its own `sync_key`.

That is the same anti-duplication principle used in TikTok.

---

## Recommended Status Mapping

### Shopee Order Status -> Internal Status

Suggested baseline:

| Shopee | Internal |
|---|---|
| `UNPAID` | `Chưa thanh toán` |
| `READY_TO_SHIP` | `Chờ xử lý vận chuyển` |
| `PROCESSED` | `Chờ xử lý vận chuyển` |
| `SHIPPED` | `Đang giao` |
| `TO_CONFIRM_RECEIVE` | `Đang giao` |
| `COMPLETED` | `Đã giao` |
| `CANCELLED` | `Đã huỷ` |

### Shopee Return Status -> Internal Status

Suggested baseline:

| Shopee | Internal |
|---|---|
| `REQUESTED` | `Chưa về kho` |
| `ACCEPTED` | `Chưa về kho` |
| `PROCESSING` | `Chưa về kho` |
| `JUDGING` | `Chưa về kho` |
| `REFUND_PAID` | `Cần kiểm tra` |
| `CLOSED` | `Cần kiểm tra` |
| `SELLER_DISPUTE` | `Cần kiểm tra` |
| `CANCELLED` | `Đã huỷ` |

This can be adjusted later with business feedback, but the key is to keep Shopee and TikTok in the same vocabulary.

---

## Request Type Mapping

Recommended business labels:

| Condition | Lark `Loại yêu cầu` |
|---|---|
| return with logistics / item return | `Đơn THHT` |
| refund only / no physical return | `Hoàn tiền` |
| cancellation case | `Đơn huỷ` |
| complaint/dispute case | `Khiếu nại` |

For the sample payload:

- `needs_logistics = true`
- `return_sn` exists
- reverse logistics fields exist

Recommended output:

- `Loại yêu cầu = Đơn THHT`

---

## Sample Mapping From `shopee-return-full.json`

Given:

- `order_sn = 230524H8CCH1Y9`
- `return_sn = 2305270RKKMVHFD`
- `status = REFUND_PAID`
- `needs_logistics = true`
- `reason = DIFFERENT_DESCRIPTION`
- `text_reason = Quạt không tích điện`
- `update_time = 1685635190`

Recommended normalized result:

```text
Kênh bán           = Shopee
Thương hiệu        = <brand from shop config>
Mã đơn gốc         = 230524H8CCH1Y9
Mã đơn trả         = 2305270RKKMVHFD
Ngày tạo đơn       = <from original order create_time>
Loại yêu cầu       = Đơn THHT
Trạng thái/TH - HT = Cần kiểm tra
ID_SHOP            = shopCode || shopId
Ngày về kho        = fallback from reverse logistics milestone or update_time
```

---

## Normalizer Implementation Plan

### `normalizeShopeeOrder(rawOrder, shopMeta)`

Must output:

- `requestType = ORDER`
- `sync_key` based on order only
- `Ngày tạo đơn` from `rawOrder.create_time`
- `Loại yêu cầu` from order business meaning
- `Trạng thái/TH - HT` from `mapShopeeOrderStatus`

### `normalizeShopeeReturn(rawReturn, shopMeta)`

Must output:

- `requestType = RETURN` or `REFUND` depending on business rule
- `sync_key` based on `order_sn + return_sn`
- `Mã đơn gốc = order_sn`
- `Mã đơn trả = return_sn`
- `Ngày tạo đơn` from order record
- `Loại yêu cầu` from return/refund type
- `Trạng thái/TH - HT` from `mapShopeeReturnStatus`
- `Ngày về kho` from reverse logistics / fallback logic

---

## Reconcile Strategy

Shopee reconcile should mirror TikTok reconcile:

### Orders

- scan by `update_time`
- fetch detail
- normalize
- upsert DB
- upsert Lark

### Returns

- scan by return update time
- fetch detail
- normalize
- link back to original order
- upsert DB
- upsert Lark

---

## DB / Sync Behavior

Keep the same behavior as TikTok:

- skip if incoming update is not newer than existing `lastTiktokUpdateTime` equivalent
- upsert `normalized_requests`
- upsert `lark_records`
- preserve idempotency using `sync_key`

Even for Shopee, the table can keep the same normalized structure.

---

## Recommended Fallback Logic

If Shopee return detail does not contain enough data:

1. try to find original order in `normalized_requests`
2. if found, reuse `orderCreatedAt`
3. if reverse logistics arrival timestamp is missing, fallback to `update_time`
4. if request type is unclear:
   - `needs_logistics = true` -> `Đơn THHT`
   - otherwise -> `Hoàn tiền`

---

## Minimal Acceptance Criteria

Implementation is considered correct when:

1. Shopee order and return records appear in the same Lark table as TikTok.
2. `Ngày tạo đơn` always represents original order creation time.
3. `Mã đơn gốc` and `Mã đơn trả` are filled correctly.
4. `Loại yêu cầu` is business-readable and consistent with TikTok.
5. `Trạng thái/TH - HT` uses the same internal vocabulary as TikTok.
6. Duplicate records are prevented by stable `sync_key`.
7. `ID_SHOP` displays `shopCode || shopId`.

---

## Recommended Next Steps

1. Add or confirm Shopee return detail API support.
2. Keep `get_return_list` only for scanning changes.
3. Normalize Shopee detail payloads into the shared `NormalizedData` structure.
4. Reuse TikTok-style DB and Lark upsert flow.
5. Validate with 3-5 real return cases:
   - refund only
   - physical return
   - cancelled request
   - dispute case
   - completed refund

---

## Final Recommendation

Do not build a Shopee-specific Lark logic.

Instead, build a Shopee-to-NormalizedData adapter that behaves like TikTok. That keeps:

- one Lark table
- one business vocabulary
- one sync engine
- one anti-duplicate model
- one reconciliation mindset

This is the cleanest and safest way to scale both TikTok and Shopee in the same system.
