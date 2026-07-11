# Filter Strategy Guide - Shopee Must Match TikTok Narrow Filter

## Purpose

This document defines the required filter strategy for Shopee:

> Shopee must follow the same narrow filtering logic currently used by TikTok order reconciliation.

This means Shopee should **not** use a wide-intake approach.

Instead:

- aggressively filter orders before syncing to Lark
- exclude normal orders and common cancellation cases
- only keep operationally meaningful failure cases

---

## Target Behavior

Shopee should behave like TikTok in the current codebase:

### Orders

- do **not** sync all updated orders
- do **not** sync in-transit orders
- do **not** sync normal completed orders
- do **not** sync buyer-cancelled orders
- do **not** sync seller-cancelled orders
- only sync the cancellation cases that represent **failed delivery / logistics failure / operational exception**

### Returns / Refunds

- still sync these flows
- because they are real after-sale operational records

---

## Reference TikTok Logic

The existing TikTok order reconcile logic works like this:

1. fetch updated orders
2. only keep orders where `status = CANCELLED`
3. reject orders cancelled by buyer
4. reject orders cancelled by seller
5. only keep orders that look like logistics / failed-delivery cases
6. mark them as `_is_failed_delivery = true`
7. sync them to Lark

That is the model Shopee should follow.

---

## Core Principle

The Lark table is not intended to store every order state transition.

It is intended to store:

- operational exception cases
- after-sale handling cases
- return/refund/cancel cases that require business attention

Because of that, Shopee orders must be filtered narrowly before entering the sync pipeline.

---

## Scope Split

### Shopee Orders

Apply **strict filtering**.

### Shopee Returns / Refunds

Keep syncing because these are already the operational records the team cares about.

---

## Shopee Order Filter Policy

### Keep

Only keep Shopee orders that meet business conditions equivalent to TikTok failed-delivery logic.

Typical examples:

- cancelled because delivery failed
- cancelled because logistics could not complete delivery
- cancelled because the parcel returned during transport operations
- cancelled because of platform/logistics operational failure

### Exclude

Do not sync:

- `UNPAID`
- `READY_TO_SHIP`
- `PROCESSED`
- `SHIPPED`
- `TO_CONFIRM_RECEIVE`
- `COMPLETED`
- ordinary `CANCELLED` cases caused by buyer
- ordinary `CANCELLED` cases caused by seller
- normal operational order states that are not exception cases

---

## Why This Strategy Is Required

### 1. Match TikTok Behavior

The user requirement is not “Shopee should work in its own way”.

The requirement is:

> Shopee must behave the same way as TikTok.

That means Shopee order filtering must follow TikTok’s current business philosophy.

### 2. Keep Lark Clean

If Shopee syncs all updated orders while TikTok only syncs narrow exception cases, the Lark table becomes inconsistent across platforms.

### 3. Preserve Business Meaning

The table is meant for operational handling, not full order auditing.

---

## Recommended Filter Layer

The filter should happen in:

- `reconcileShopeeOrders()`

This matches TikTok, where the strict filter lives in:

- `reconcileOrders()`

Reason:

- reconcile is the right layer for deciding what enters the sync flow
- normalizer should classify the kept record, not decide broad inclusion policy

---

## Recommended Shopee Filtering Inputs

Shopee filtering should rely on:

- `order_status`
- `cancel_by`
- `cancel_reason`
- other logistics-related fields if present

The exact field names depend on Shopee order detail payloads returned by:

- `get_order_detail`

---

## Filtering Rule Design

### Step 1

Reject all orders whose status is not operationally relevant.

That means:

- if order is not `CANCELLED`
- reject it immediately

This matches TikTok narrow filter style.

### Step 2

For `CANCELLED` orders:

- inspect who cancelled it
- inspect why it was cancelled

### Step 3

Reject buyer-driven cancellation cases.

Examples:

- customer placed wrong order
- customer changed address
- customer no longer wants the order

### Step 4

Reject seller-driven ordinary cancellation cases.

Examples:

- seller stock issue
- seller manual cancellation
- seller no longer fulfills order

### Step 5

Keep only logistics / failed-delivery / operational-failure cases.

Examples:

- delivery failure
- unable to deliver
- parcel returned by logistics
- logistics exception
- delivery unsuccessful

---

## Required Output Meaning

If a Shopee order survives the filter, it should be treated like a TikTok failed-delivery exception.

Recommended normalized behavior:

- mark special flag similar to `_is_failed_delivery`
- map `Loại yêu cầu = Giao hàng thất bại`
- map internal order status according to business rules

This keeps Shopee and TikTok aligned.

---

## Returns / Refunds Policy

Shopee return/refund flows should still be synced.

Reason:

- they are already explicit after-sale requests
- they belong to the exact operational domain the Lark table is meant to support

So for returns/refunds:

- keep reconcile by time window
- fetch detail
- normalize
- sync

No TikTok-style order narrow filter should be applied to return/refund requests themselves.

---

## Recommended Technical Structure

### `reconcileShopeeOrders()`

Should:

1. fetch updated Shopee orders
2. inspect full detail payload
3. apply strict business filter
4. only send surviving records into `syncOrdersBatch()`

### `normalizeShopeeOrder()`

Should:

- normalize only records already allowed through the filter
- classify them into business meaning
- fill `Loại yêu cầu`, `Trạng thái/TH - HT`, `ID_SHOP`

### `reconcileShopeeReturns()`

Should:

- continue syncing return/refund detail payloads
- not inherit the strict order-only exclusion rule

---

## Pseudocode

```ts
const orders = await getUpdatedOrders(...);

const filteredOrders = orders.filter((o) => {
  const status = String(o.order_status || '').toUpperCase();
  if (status !== 'CANCELLED') return false;

  const cancelBy = String(o.cancel_by || o.cancelled_by || '').toUpperCase();
  const cancelReason = String(o.cancel_reason || '').toUpperCase();

  if (cancelBy === 'BUYER' || cancelReason.includes('BUYER')) return false;
  if (cancelBy === 'SELLER' || cancelReason.includes('SELLER')) return false;

  if (
    cancelBy === 'LOGISTICS' ||
    cancelReason.includes('DELIVERY') ||
    cancelReason.includes('FAIL') ||
    cancelReason.includes('UNSUCCESSFUL') ||
    cancelReason.includes('RETURN') ||
    cancelReason.includes('LOGISTICS')
  ) {
    o._is_failed_delivery = true;
    return true;
  }

  return false;
});
```

Then:

```ts
await syncOrdersBatch(filteredOrders, shopMeta, SYNC_SOURCES.CRON);
```

---

## Mapping Expectation

If a Shopee order passes the filter, its Lark output should resemble TikTok failed-delivery behavior:

- `Loại yêu cầu = Giao hàng thất bại`
- `Trạng thái/TH - HT` from internal mapping
- `Mã đơn gốc = order_sn`
- `Mã đơn trả = empty`
- `ID_SHOP = shopCode || shopId`

If the order does not pass the filter:

- it should not be synced to Lark through order reconcile

---

## DB Impact

This narrow strategy reduces noise in:

- `normalized_requests`
- `lark_records`
- `sync_logs`

It also keeps Shopee record volume closer to TikTok’s current order philosophy.

Important:

- do not change `sync_key` format
- do not change return/refund sync key behavior
- only narrow which order records are allowed into sync

---

## Cron Impact

Scheduler behavior does not change.

What changes is:

- `reconcileShopeeOrders()` becomes much stricter
- fewer order records enter sync
- order reconcile result becomes more similar to TikTok reconcile output

This is expected and desired.

---

## Risks

### Risk 1: Missing a relevant Shopee cancel subtype

If Shopee uses a raw cancel reason not included in the strict filter, an operationally meaningful record may be dropped.

Mitigation:

- log rejected cancelled orders during early rollout
- review real cancel reasons
- refine allowed logistics-failure patterns

### Risk 2: Shopee field naming differs from assumption

Mitigation:

- inspect actual `get_order_detail` payloads
- confirm which fields represent:
  - status
  - cancel initiator
  - cancel reason

### Risk 3: Webhook logic and reconcile logic diverge

If Shopee later gets webhook-based order sync, the same filter must also be applied there.

---

## Acceptance Criteria

The implementation is correct when:

1. Shopee order reconcile only syncs narrow exception cases
2. buyer-cancelled orders are excluded
3. seller-cancelled ordinary orders are excluded
4. in-transit and normal completed orders are excluded
5. logistics-failure / failed-delivery cancellations are included
6. Shopee returns/refunds still sync normally
7. Shopee output is behaviorally aligned with TikTok

---

## Final Recommendation

Shopee must not use wide filtering.

Shopee should copy TikTok’s current order logic:

- strict order filtering
- exception-only order sync
- full return/refund sync

This is the cleanest way to keep both platforms aligned in one operational Lark table.
