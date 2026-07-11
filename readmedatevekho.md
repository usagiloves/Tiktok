# Warehouse Receive Date Strategy - Option B

## Purpose

This document defines how to implement `Ngày về kho` using **Option B**:

- use a real warehouse-related timestamp if the marketplace API provides one
- otherwise fallback to the marketplace `update_time`
- but only when the request has reached a strong enough business stage

This is the same practical system-minded approach currently used in the TikTok module.

---

## What `Ngày về kho` Means In Option B

`Ngày về kho` is not always the exact physical warehouse scan timestamp.

Under Option B, it means:

> the best available operational timestamp that strongly indicates the returned parcel has already reached the return handling stage

This makes the field useful for:

- CSKH tracking
- operational sorting
- reconciliation
- return queue handling

while still allowing the system to auto-fill data when the API does not expose a perfect warehouse confirmation timestamp.

---

## Core Rule

Use this priority order:

1. **Explicit warehouse / receive timestamp from API**
2. **Fallback to `update_time`**
   only if the request status is already in a business-approved stage
3. **Otherwise leave `Ngày về kho` empty**

---

## Option B Decision Tree

### Step 1

If the payload contains an explicit warehouse-related timestamp, use it.

Examples:

- `warehouse_receive_time`
- `receive_time`
- `return_completed_time`
- `completed_time`
- any future Shopee reverse-logistics arrival timestamp if available

### Step 2

If no explicit warehouse timestamp exists:

- evaluate the normalized internal status
- if the status has entered a “strong enough” stage, set:

```text
Ngày về kho = update_time
```

### Step 3

If the request is still too early in the reverse flow, keep:

```text
Ngày về kho = empty
```

---

## Business-Approved Strong Statuses

Option B should only fallback to `update_time` when the request has already reached a stage that strongly suggests the return flow is effectively complete enough for warehouse handling.

Recommended internal statuses for fallback:

- `Cần kiểm tra`

Depending on business rules, this may later be expanded carefully, but the default recommendation is to keep fallback narrow.

---

## TikTok Implementation Logic

The current TikTok idea should be interpreted as:

- if TikTok gives a real receive timestamp, use it
- otherwise, once the return reaches a strong internal state like `Cần kiểm tra`, use the final meaningful `update_time`

This means TikTok already behaves like:

```text
real warehouse date if available
else API cut-off / last meaningful update
```

That is exactly Option B.

---

## Shopee Implementation Logic

Shopee should follow the same rule.

### Recommended Shopee interpretation

Use a real timestamp first if Shopee provides one.

If not, fallback to `update_time` only when the Shopee return has already entered a strong enough state such as:

- `REFUND_PAID`
- `CLOSED`
- `SELLER_DISPUTE`

after mapping into internal status:

- `Cần kiểm tra`

Do not auto-fill `Ngày về kho` for early statuses like:

- `REQUESTED`
- `ACCEPTED`
- `PROCESSING`
- `JUDGING`

These should remain empty.

---

## Recommended Internal Status Policy

### Fill `Ngày về kho`

Allowed when:

- explicit warehouse timestamp exists
- or internal status = `Cần kiểm tra`

### Do Not Fill `Ngày về kho`

Keep empty when internal status is:

- `Chưa về kho`
- `Từ chối`
- `Đã huỷ`

Reason:

- `Chưa về kho` means reverse flow is still in progress
- `Từ chối` does not imply goods were received
- `Đã huỷ` does not imply physical receipt

---

## Why Option B Is Good

### Advantages

1. More complete data than strict warehouse-only logic
2. Better automation for cron reconcile
3. Consistent with the current TikTok implementation style
4. Useful for operations even when marketplace APIs are incomplete

### Tradeoff

Fallback `update_time` is a **proxy timestamp**, not guaranteed to be the exact warehouse-confirmed receipt time.

That tradeoff is accepted in Option B.

---

## Risks And Guardrails

### Risk 1: Filling the date too early

If fallback is allowed for weak statuses, `Ngày về kho` becomes misleading.

Guardrail:

- only fallback when internal status is already `Cần kiểm tra`

### Risk 2: Business users think the date is a physical warehouse scan

Guardrail:

- document clearly that Option B uses:

```text
best available marketplace timestamp when warehouse timestamp is missing
```

### Risk 3: Shopee and TikTok behave inconsistently

Guardrail:

- apply the same priority order on both platforms
- use platform-specific raw fields, but one common business rule

---

## Recommended Pseudocode

```ts
let warehouseReceivedAt: Date | null = null;

if (explicitWarehouseTimestampExists(raw)) {
  warehouseReceivedAt = explicitWarehouseTimestamp(raw);
} else if (internalStatus === 'Cần kiểm tra' && lastUpdateTime) {
  warehouseReceivedAt = lastUpdateTime;
}

if (warehouseReceivedAt) {
  larkFields['Ngày về kho'] = formatLarkDateTime(warehouseReceivedAt);
}
```

---

## TikTok Raw Field Priority

Recommended priority:

1. `warehouse_receive_time`
2. `receive_time`
3. `return_completed_time`
4. `completed_time`
5. fallback to `update_time` only when internal status = `Cần kiểm tra`

---

## Shopee Raw Field Priority

Recommended priority:

1. explicit reverse-logistics arrival / warehouse timestamp if available
2. fallback to `update_time` only when internal status = `Cần kiểm tra`
3. otherwise empty

If Shopee later exposes a better return warehouse timestamp, it should replace the fallback automatically.

---

## Examples

### Example A: Strong state, no warehouse timestamp

Input:

- no explicit warehouse timestamp
- internal status = `Cần kiểm tra`
- `update_time` exists

Result:

- `Ngày về kho = update_time`

### Example B: Early return stage

Input:

- no explicit warehouse timestamp
- internal status = `Chưa về kho`

Result:

- `Ngày về kho = empty`

### Example C: Explicit warehouse timestamp exists

Input:

- `warehouse_receive_time` exists

Result:

- `Ngày về kho = warehouse_receive_time`

---

## Acceptance Criteria

Option B is implemented correctly when:

1. explicit warehouse timestamps always override fallback logic
2. `update_time` is used only for approved strong statuses
3. weak statuses never auto-fill `Ngày về kho`
4. Shopee and TikTok follow the same business decision rule
5. the system remains idempotent during cron reconcile and retries

---

## Final Recommendation

Use Option B as the standard strategy for both TikTok and Shopee:

- prefer warehouse timestamp if available
- fallback to `update_time` only when internal status is strong enough
- otherwise keep the field empty

This gives the best balance between:

- automation
- operational usefulness
- consistency across platforms
- acceptable business accuracy
