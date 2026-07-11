## Tích hợp J&T Express cho bài toán `Ngày về kho`

Tài liệu này mô tả:

1. Thông số kết nối API J&T Express
2. Cách hiểu nghiệp vụ `Ngày về kho`
3. Phương án tích hợp J&T vào hệ thống hiện tại
4. Luồng xử lý đề xuất trong code
5. Kế hoạch triển khai an toàn

---

## 1. Mục tiêu tích hợp

Mục tiêu duy nhất của cổng J&T Express trong giai đoạn này là:

- phục vụ các đơn huỷ / giao hàng thất bại
- hỗ trợ điền cột `Ngày về kho` lên Lark Base

J&T **không** phải là nguồn đồng bộ chính của hệ thống.

Nguồn đồng bộ chính vẫn là:

- TikTok Shop API
- Shopee API

J&T chỉ đóng vai trò:

- tra cứu hành trình vận chuyển
- tìm mốc thời gian phù hợp để bổ sung `Ngày về kho`

---

## 2. Logic nghiệp vụ cần bám theo

Logic hiện tại của TikTok đã chốt như sau:

- Khi người bán bấm xác nhận nhận hàng hoàn, một số đơn sẽ bị cắt API ở phía sàn
- Vì vậy hệ thống không phải lúc nào cũng lấy được một mốc "nhập kho thật" tuyệt đối
- Trong trường hợp đó, hệ thống lấy **mốc cập nhật API cuối cùng** để điền `Ngày về kho`
- Mục đích là để kho kiểm soát vận hành
- Việc xác nhận hàng đã về thật hay chưa là bước nghiệp vụ do kho xử lý

Vì vậy `Ngày về kho` trong hệ thống hiện tại nên được hiểu là:

> Mốc thời gian vận hành tốt nhất mà hệ thống còn thu thập được để phục vụ kiểm soát kho

Nó không bắt buộc phải là:

- thời điểm scan nhập kho vật lý tuyệt đối

Đây là nguyên tắc phải giữ nguyên khi tích hợp thêm J&T.

---

## 3. Thông tin API J&T Express

### 3.1. Mô tả kết nối

Tra thông tin hành trình đơn hàng.

### 3.2. Endpoint

- UAT: `https://demoopenapi.jtexpress.vn/webopenplatformapi/api/logistics/trace`
- Production: `https://ylopenapi.jtexpress.vn/webopenplatformapi/api/logistics/trace`

### 3.3. Cách thức gọi

- Method: `POST`
- Content-Type: `x-www-form-urlencoded`
- Response: `JSON`

### 3.4. Header bắt buộc

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `apiAccount` | Number | Có | `apiAccount` trong Quản lý ứng dụng |
| `digest` | String | Có | Giá trị mã hoá theo cơ chế xác thực J&T |
| `timestamp` | Number | Có | Thời gian tính bằng mili giây, múi giờ UTC+7 |

### 3.5. Body request

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `bizContent` | String | Có | Chuỗi JSON chứa tham số nghiệp vụ |

### 3.6. Tham số nghiệp vụ trong `bizContent`

| Tham số | Kiểu | Bắt buộc | Ví dụ | Mô tả |
|---------|------|----------|-------|-------|
| `customerCode` | String(30) | Có | `084LC02000` | Mã khách hàng |
| `password` | String | Có | `H5CD3zE6` | Mật khẩu xác thực |
| `txlogisticId` | String | Có | `TESTID000001` | Mã đơn đặt khách hàng |
| `billcodes` | String(500) | Có | `842800765741` | Mã vận đơn, tối đa 30 đơn, ngăn cách bằng dấu phẩy |

### 3.7. Response

| Trường | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `code` | String | Có | Kết quả, ví dụ `success` hoặc `fail` |
| `msg` | String | Có | Thông điệp trả về |
| `data` | Object / Array | Có | Dữ liệu nghiệp vụ |

### 3.8. Cấu trúc chi tiết trong `data`

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `billCode` | String | Có | Mã vận đơn |
| `details` | Array | Có | Danh sách sự kiện hành trình |

### 3.9. Cấu trúc mỗi phần tử trong `details`

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `scanTime` | String | Có | Thời gian thao tác |
| `desc` | String | Có | Mô tả hành trình |
| `scanTypeCode` | int | Có | Mã loại thao tác |
| `scanTypeName` | String | Có | Tên loại thao tác |
| `scanNetworkName` | String | Có | Tên trạm thao tác |
| `scanNetworkId` | String | Có | ID bưu cục |
| `staffName` | String | Có | Tên nhân viên |
| `staffContact` | String | Không | Liên hệ nhân viên |
| `scanNetworkContact` | String | Không | Liên hệ bưu cục |
| `scanNetworkProvince` | String | Có | Tỉnh |
| `scanNetworkCity` | String | Có | Thành phố |
| `scanNetworkArea` | String | Có | Phường/Xã |
| `pictureUrl` | Array | Không | Danh sách ảnh thao tác |

### 3.10. Một số mã hành trình đáng chú ý

Theo tài liệu hiện có:

- `106`: Picked up
- `109`: Departure
- `110`: Arrival
- `112`: On Delivery
- `113`: Delivered
- `116`: Returning
- `117`: Returned Sign
- `118`: Delivery Problem
- `120`: Return Problem

Lưu ý:

- Cần xác minh lại bằng payload thực tế của shop
- Không nên hardcode toàn bộ logic chỉ dựa trên tên mã trong tài liệu

---

## 4. Kết luận quan trọng về dữ liệu J&T

J&T **không trả về một field `warehouse_received_at` chuẩn** giống kiểu dữ liệu nội bộ mong muốn.

Thay vào đó, J&T trả về:

- danh sách sự kiện hành trình `details[]`

Do đó hệ thống phải:

1. gọi API J&T lấy timeline
2. duyệt các event trong `details[]`
3. chọn ra event phù hợp nhất để suy ra `Ngày về kho`

Nói cách khác:

> J&T là nguồn timeline logistics, không phải nguồn `Ngày về kho` dạng field sẵn có

---

## 5. Nguyên tắc tích hợp vào hệ thống

### 5.1. Không biến J&T thành nguồn sync chính

J&T không được dùng để:

- tạo record độc lập lên Lark
- thay thế TikTok API hoặc Shopee API
- điều khiển toàn bộ flow đồng bộ

J&T chỉ được dùng để:

- enrich dữ liệu cho order huỷ do logistics
- tìm mốc `Ngày về kho`

### 5.2. Chỉ áp dụng cho nhóm đơn phù hợp

Chỉ gọi J&T cho các order:

- đã bị xác định là `Giao hàng thất bại`
- hoặc thuộc nhóm huỷ do logistics / giao không thành công

Không gọi J&T cho:

- toàn bộ order thường
- toàn bộ order đang giao
- toàn bộ return/refund

### 5.3. Không phá workaround hiện tại

Logic hiện tại của TikTok phải được giữ:

- nếu có mốc tốt hơn thì dùng
- nếu không có thì fallback về `update_time` cuối cùng

J&T chỉ làm cho `Ngày về kho` tốt hơn, không thay thế hoàn toàn cơ chế fallback đang chạy.

---

## 6. Thứ tự ưu tiên điền `Ngày về kho`

Khi tích hợp xong, hệ thống nên fill `Ngày về kho` theo thứ tự:

### Ưu tiên 1

Mốc kho thật từ marketplace nếu có, ví dụ:

- `warehouse_receive_time`
- `receive_time`
- `return_completed_time`
- `completed_time`

### Ưu tiên 2

Mốc hành trình phù hợp lấy từ J&T:

- event hoàn hàng
- event hàng về trạm
- event hàng hoàn tất trả về
- event scan đủ mạnh để chứng minh hàng đã quay về luồng hoàn

### Ưu tiên 3

`update_time` cuối cùng từ TikTok hoặc Shopee

Đây là fallback cuối cùng để phục vụ kho kiểm soát.

---

## 7. Cách hiểu event J&T để map `Ngày về kho`

### 7.1. Hướng chọn event

Chỉ nên chọn những event đủ mạnh về mặt vận hành, ví dụ:

- `Returned Sign`
- `Returning`
- `Return Problem`
- `Arrival`
- hoặc `desc` thể hiện hàng đã về trạm / về bưu cục / hoàn về

### 7.2. Hướng không nên dùng ngay

Không nên lấy bừa các event như:

- `Picked up`
- `On Delivery`
- `Delivered`
- `Quét phát hàng`
- `Nhận hàng`

vì các mốc này không phản ánh đúng bài toán hàng hoàn quay về.

### 7.3. Nguyên tắc an toàn

Ban đầu nên triển khai mapper theo hướng bảo thủ:

- nếu không chắc event có ý nghĩa `về kho`
- thì không dùng event đó
- và để hệ thống fallback về `update_time`

---

## 8. Phương án kiến trúc triển khai

### 8.1. Module mới đề xuất

Tạo module riêng:

```text
src/modules/jt-express/
  jt-express.module.ts
  jt-express.client.ts
  jt-express.mapper.ts
```

### 8.2. Vai trò từng file

#### `jt-express.client.ts`

Chịu trách nhiệm:

- sinh request đúng chuẩn J&T
- build header `apiAccount`, `digest`, `timestamp`
- gửi body `bizContent` dạng form-urlencoded
- nhận response raw

#### `jt-express.mapper.ts`

Chịu trách nhiệm:

- đọc `details[]`
- sắp xếp / duyệt timeline
- chọn event phù hợp nhất cho `Ngày về kho`
- trả ra kết quả đã chuẩn hoá

Ví dụ output nội bộ:

```ts
{
  warehouseReceivedAt: Date | null,
  matchedEventCode: number | null,
  matchedEventName: string | null,
  matchedDesc: string | null,
  lastEventAt: Date | null,
}
```

#### `jt-express.module.ts`

Chịu trách nhiệm:

- export `JtExpressClient`
- inject vào luồng reconcile hoặc sync

---

## 9. Điểm hook vào hệ thống hiện tại

### 9.1. Điểm hook phù hợp nhất

Tích hợp vào luồng order sau khi đã lọc xong `failedDeliveryOrders`.

Nơi phù hợp nhất:

- `reconcileOrders()` cho TikTok
- `reconcileShopeeOrders()` cho Shopee

### 9.2. Luồng xử lý đề xuất

```text
TikTok/Shopee API
-> lấy order list / detail
-> filter ra đơn huỷ do logistics / giao thất bại
-> nếu có mã vận đơn J&T thì gọi J&T trace
-> enrich raw order với dữ liệu J&T
-> normalize
-> upsert DB
-> upsert Lark
```

### 9.3. Các field enrich nội bộ nên thêm

Chỉ lưu để phục vụ debug / nghiệp vụ nội bộ:

- `_jt_bill_code`
- `_jt_trace_details`
- `_jt_matched_event_code`
- `_jt_matched_event_name`
- `_jt_matched_desc`
- `_jt_warehouse_received_at`
- `_jt_last_event_at`

Các field này:

- có thể lưu trong DB payload
- không bắt buộc đẩy toàn bộ lên Lark

---

## 10. Quy tắc áp dụng cho TikTok và Shopee

### 10.1. TikTok

TikTok hiện đang có logic fallback `Ngày về kho` bằng `update_time`.

Sau khi có J&T:

- nếu J&T cho mốc tốt hơn thì dùng J&T
- nếu J&T không có gì đủ mạnh thì giữ nguyên fallback hiện tại

### 10.2. Shopee

Shopee nên bám cùng triết lý như TikTok:

- không cần đòi warehouse timestamp tuyệt đối
- nếu có mốc logistics phù hợp từ J&T thì dùng
- nếu không có thì fallback `update_time`

### 10.3. Kết luận

J&T phải được xem là:

- một lớp enrich chung
- dùng được cho cả TikTok lẫn Shopee
- miễn là order đó có mã vận đơn thuộc J&T

---

## 11. Config môi trường đề xuất

Không lưu credential thật trong markdown.

Nên đưa toàn bộ vào `.env`:

```env
JT_API_BASE_URL=https://ylopenapi.jtexpress.vn/webopenplatformapi/api/logistics/trace
JT_API_ACCOUNT=
JT_CUSTOMER_CODE=
JT_PASSWORD=
JT_PRIVATE_KEY=
JT_ENABLED=true
```

Nếu cần môi trường UAT:

```env
JT_UAT_API_BASE_URL=https://demoopenapi.jtexpress.vn/webopenplatformapi/api/logistics/trace
```

---

## 12. Lưu ý bảo mật

File tài liệu kỹ thuật không nên chứa lâu dài:

- `apiAccount`
- `privateKey`
- `customerCode`
- `password`

Lý do:

- đây là thông tin nhạy cảm
- dễ bị lộ khi commit hoặc chia sẻ repo

Khuyến nghị:

- chỉ giữ ví dụ cấu trúc
- đưa giá trị thật vào `.env`

---

## 13. Quy tắc nghiệp vụ cuối cùng cho `TH-HT`

Sau khi chốt lại với nghiệp vụ vận hành, rule đúng cho nhóm đơn hoàn về cần theo dõi hệ thống là:

### Trường hợp 1 - Chưa có `Ngày về kho`

Khi hệ thống **chưa xác định được** `Ngày về kho`, thì:

- `TH-HT = Đang hoàn`

Ý nghĩa:

- đơn vẫn đang nằm trong luồng hoàn về
- kho chưa có mốc hệ thống đủ mạnh để bắt đầu kiểm tra

### Trường hợp 2 - Đã có `Ngày về kho`

Ngay khi hệ thống **đã xác định được** `Ngày về kho`, thì:

- `TH-HT = Cần kiểm tra`

Ý nghĩa:

- hệ thống đã có mốc vận hành đủ mạnh cho thấy đơn đã quay về luồng kiểm soát kho
- từ thời điểm này kho cần kiểm tra thực tế kiện hàng

### Lưu ý quan trọng

Trong bài toán này:

- `Loại yêu cầu` đã đủ để thể hiện bản chất nghiệp vụ, ví dụ:
  - `Giao hàng thất bại`
- `TH-HT` chỉ đóng vai trò thể hiện trạng thái hệ thống theo tiến trình hoàn về

Vì vậy:

- không dùng `TH-HT = Đã hủy` cho nhóm này nữa
- hệ thống phải chuyển theo cặp trạng thái:

```text
Chưa có Ngày về kho -> Đang hoàn
Đã có Ngày về kho   -> Cần kiểm tra
```

---

## 14. Rủi ro cần tránh

### Rủi ro 1

Gọi J&T cho toàn bộ đơn:

- tốn request
- tăng độ trễ
- không cần thiết

### Rủi ro 2

Map sai event J&T thành `Ngày về kho`:

- làm kho hiểu sai dữ liệu

### Rủi ro 3

Tin tuyệt đối vào J&T và bỏ fallback marketplace:

- có thể làm mất cơ chế an toàn hiện tại

### Rủi ro 4

Đẩy raw trace đầy đủ lên Lark:

- làm bẩn bảng nghiệp vụ
- khó dùng cho team vận hành

---

## 15. Kế hoạch triển khai khuyến nghị

### Giai đoạn 1 - Scaffold kỹ thuật

Làm các việc sau:

1. Tạo `JtExpressModule`
2. Tạo `JtExpressClient`
3. Tạo `JtExpressMapper`
4. Thêm biến môi trường

### Giai đoạn 2 - Kiểm chứng dữ liệu thật

1. Gọi thử 5-10 mã vận đơn thật
2. Lưu raw response
3. Đối chiếu event thực tế của J&T
4. Chốt event nào được xem là đủ mạnh cho `Ngày về kho`

### Giai đoạn 3 - Tích hợp vào flow

1. Hook vào `reconcileOrders()` và `reconcileShopeeOrders()`
2. Chỉ enrich cho `failedDeliveryOrders`
3. Fill `Ngày về kho` theo thứ tự ưu tiên đã chốt

### Giai đoạn 4 - Rollout an toàn

1. Chạy shadow mode, chỉ log chưa ghi đè
2. So sánh với dữ liệu hiện tại trên Lark
3. Nếu hợp lý thì bật chính thức

---

## 16. Kết luận cuối cùng

Phương án đúng cho bài toán hiện tại là:

- J&T không phải hệ thống sync chính
- J&T chỉ là nguồn enrich bổ sung cho `Ngày về kho`
- chỉ áp dụng cho đơn huỷ do logistics / giao hàng thất bại
- luôn giữ fallback `update_time` của TikTok/Shopee

Nói ngắn gọn:

```text
Marketplace là nguồn chính
J&T là nguồn bổ sung
Lark chỉ nhận kết quả nghiệp vụ cuối cùng
```

Đây là cách tích hợp an toàn nhất, sát nghiệp vụ nhất, và không phá kiến trúc hiện có của hệ thống.

Đồng thời, khi áp dụng cho nhóm đơn hoàn về / giao hàng thất bại, hệ thống phải bám đúng rule trạng thái:

```text
Chưa có Ngày về kho -> TH-HT = Đang hoàn
Có Ngày về kho      -> TH-HT = Cần kiểm tra
```
