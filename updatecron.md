Mình review nhanh phần bạn vừa sửa, và tổng thể là đã đi đúng hướng cho bài toán “cron có đang quét bù dữ liệu cũ hay không”. Nhưng hiện tại mình vẫn thấy vài điểm chưa ổn hẳn.
Findings
Medium: Báo cáo daily đang luôn gửi số 0, nên sẽ gây hiểu nhầm là cron không sync gì dù thực tế có chạy. Trong reconcileDailyOrders(), bạn đã bỏ biến stats và hardcode toàn bộ totalSynced/totalCreated/totalUpdated/totalFailed về 0. Xem [src/modules/reconcile/reconcile.scheduler.ts (line 76)](D:/Tiktok/src/modules/reconcile/reconcile.scheduler.ts:76). Nếu team nhìn bot summary để xác nhận cron sống hay chết thì chỗ này sẽ đánh lừa người vận hành.

Medium: Dữ liệu cũ 15-20 ngày của returns TikTok vẫn chưa được quét bù hàng ngày, chỉ được quét bởi job Chủ nhật lúc 03:00. Nghĩa là nếu hôm nay là giữa tuần, một return cũ 15-20 ngày chưa chắc đã được nhặt lại ngay. Logic hiện tại chỉ quét return 2 giờ gần nhất mỗi 30 phút và quét sâu 30 ngày mỗi tuần một lần. Xem [src/modules/reconcile/reconcile.scheduler.ts (line 20)](D:/Tiktok/src/modules/reconcile/reconcile.scheduler.ts:20) và [src/modules/reconcile/reconcile.scheduler.ts (line 89)](D:/Tiktok/src/modules/reconcile/reconcile.scheduler.ts:89). Nếu mục tiêu là “không sót và phát hiện sớm”, đây vẫn là lỗ hổng.

Medium: syncOrdersBatch() hiện không thực sự batch, mà lặp tuần tự từng đơn rồi gọi syncOrder() từng cái một. Tức là phần cron daily 15 ngày cho orders có thể chạy rất chậm nếu số lượng lớn, và nếu backlog tăng thì vẫn có nguy cơ không hoàn thành trong cửa sổ mong muốn. Xem [src/modules/sync/sync-engine.service.ts (line 207)](D:/Tiktok/src/modules/sync/sync-engine.service.ts:207). Tên hàm là batch nhưng hành vi thực tế vẫn là per-record.

Low: Cron daily chỉ quét orders, không quét returns cùng độ sâu 15 ngày. Nếu yêu cầu kinh doanh là “đơn cũ 15-20 ngày không được sót” áp dụng cho cả hoàn/trả, thì hiện code mới chỉ xử lý nửa bài toán. Xem [src/modules/reconcile/reconcile.scheduler.ts (line 47)](D:/Tiktok/src/modules/reconcile/reconcile.scheduler.ts:47).

Kết luận
Nếu câu hỏi là “đã tốt hơn trước chưa” thì là có:
order cũ giờ đã có job daily 15 ngày
active shop không còn bị hardcode chỉ TikTok
Shopee đã được đưa vào scheduler
Nhưng nếu câu hỏi là “đã đủ để yên tâm không sót đơn cũ 15-20 ngày chưa” thì mình trả lời là chưa hoàn toàn.
Mình khuyên chốt tiếp theo
Sửa bot summary để phản ánh số thật.
Thêm một job quét bù returns theo cửa sổ 15 ngày chạy hàng ngày, không chờ đến Chủ nhật.
Nếu backlog order lớn, đổi syncOrdersBatch() sang batch thật giống nhánh returns/Lark batch.
Nếu bạn muốn, mình có thể đề xuất ngay cho bạn một thiết kế cron “an toàn vận hành” với lịch chạy cụ thể cho:
near-real-time,
daily backfill 15 ngày,
weekly safety sweep 30 ngày.


Mình đề xuất một thiết kế cron an toàn hơn như này, mục tiêu là vừa không sót dữ liệu cũ, vừa không spam API quá mạnh.
1. Near Real-Time
Chạy mỗi 30 phút
Mục đích:
nhặt thay đổi mới nhất
phản ứng đủ nhanh cho vận hành
Phạm vi quét:
orders: now - 2h -> now
returns: now - 2h -> now
Lý do:
có overlap 2 giờ để chống miss do lệch clock, job fail, restart container
phù hợp cho luồng gần realtime
2. Daily Backfill
Chạy mỗi ngày lúc 02:00
Mục đích:
quét bù những gì near-real-time có thể bỏ sót
đặc biệt hữu ích cho case API trả chậm, token lỗi tạm thời, cron trước bị fail
Phạm vi quét:
orders: 15 ngày gần nhất
returns: 15 ngày gần nhất
Đây là điểm mình muốn bạn bổ sung mạnh nhất:
không chỉ quét orders
mà phải quét cả returns hàng ngày
Nếu Shopee bị giới hạn 15 ngày/query:
cứ giữ 15 ngày cho daily
hợp lý
3. Weekly Safety Sweep
Chạy Chủ nhật lúc 03:00
Mục đích:
sweep sâu hơn để bắt backlog lâu ngày
dùng như lớp bảo hiểm cuối
Phạm vi quét:
TikTok orders: 30 ngày gần nhất
TikTok returns: 30 ngày gần nhất
Shopee: tách thành 2 chunk 15 ngày0-15 ngày
15-30 ngày

Nếu sợ nặng:
có thể chạy lệch giờ theo platform
ví dụ 03:00 TikTok, 04:00 Shopee
4. Quy tắc chống sót
Dù dùng cron nào, nên giữ các nguyên tắc này:
cửa sổ quét luôn overlap
sync theo update_time, không chỉ theo create_time
idempotent bằng sync_key
nếu record đã có lastTiktokUpdateTime mới hơn thì skip
log rõ số lượng:fetched
filtered
created
updated
skipped
failed

5. Cảnh báo vận hành
Mỗi cron nên ghi ra summary thật, không hardcode 0.
Daily summary tối thiểu nên có:
platform
job name
from/to
total fetched
total pushed
total skipped
total failed
Nếu không, người vận hành sẽ không biết cron “đang chạy rỗng” hay “đang hỏng”.
6. Khuyến nghị chốt
Mình sẽ chốt thiết kế như sau:
*/30 * * * *
reconcileRecentOrders
reconcileRecentReturns
quét 2 giờ gần nhất

0 2 * * *
reconcileDailyBackfillOrders
reconcileDailyBackfillReturns
quét 15 ngày gần nhất

0 3 * * 0
reconcileWeeklySafetySweep
TikTok 30 ngày
Shopee chia 2 x 15 ngày

Nếu bạn muốn, bước tiếp theo mình có thể làm một bản mapping từ thiết kế này sang đúng các hàm/code hiện tại của repo để bạn sửa rất nhanh, không cần nghĩ lại kiến trúc.




Map thẳng vào code hiện tại của repo như sau.
1. reconcile.scheduler.ts
Tách thành 3 nhóm job rõ ràng.
Giữ:
reconcileRecentReturns() nhưng đổi tên nếu muốn cho đúng nghĩa hơn vì nó đang quét cả orders lẫn returns.
Nên có:
reconcileNearRealtime()
mỗi 30 phút
với mỗi shop:TikTok:reconcileReturns(shopId, now - 2h, now)
reconcileOrders(shopId, now - 2h, now)

Shopee:reconcileShopeeReturns(shopId, now - 2h, now)
reconcileShopeeOrders(shopId, now - 2h, now)



reconcileDailyBackfill()
mỗi ngày 02:00
với mỗi shop:TikTok:reconcileReturns(shopId, now - 15d, now)
reconcileOrders(shopId, now - 15d, now)

Shopee:reconcileShopeeReturns(shopId, now - 15d, now)
reconcileShopeeOrders(shopId, now - 15d, now)



reconcileWeeklySafetySweep()
Chủ nhật 03:00
với mỗi shop:TikTok:reconcileReturns(shopId, now - 30d, now)
reconcileOrders(shopId, now - 30d, now) nếu muốn sweep cả order backlog

Shopee:reconcileShopeeReturns(shopId, now - 30d, now - 15d)
reconcileShopeeReturns(shopId, now - 15d, now)
tương tự cho orders nếu API bị giới hạn range



2. reconcile.service.ts
Phần service hiện khá ổn về shape, nên không cần thay kiến trúc lớn.
Cần giữ nguyên tinh thần:
reconcileOrders() dùng updateTimeFrom/updateTimeTo
reconcileReturns() dùng updateTimeFrom/updateTimeTo
detectRequestType() tiếp tục gom loại request
Nên bổ sung:
trả ra stats thật cho từng lần chạy:fetched
processed
created
updated
skipped
errors

Hiện giờ:
stats.total đang hơi nhập nhằng giữa fetched và synced
điều này làm report khó tin
Mình khuyên sửa semantics:
fetched: số item API trả về
processed: số item sau filter
created/updated/skipped/errors: số kết quả sync
3. sync-engine.service.ts
Đây là chỗ nên chỉnh tiếp nếu muốn cron chạy bền hơn.
Hiện tại:
syncReturnsBatch() là batch thật hơn
syncOrdersBatch() vẫn chỉ loop từng record
Nên làm:
nếu order backlog lớn, refactor syncOrdersBatch() theo pattern của processBatchNormalizedData()
ít nhất phải gom:normalize hàng loạt
đọc existingRequests một lần
upsert DB theo transaction
batch upsert Lark

Nếu chưa làm ngay, hệ thống vẫn chạy được, nhưng daily backfill 15 ngày sẽ dễ chậm.
4. Reporting / Bot summary
Trong reconcile.scheduler.ts, đừng gửi summary toàn 0.
Nên:
cộng stats của tất cả shop trong job đó
gửi số thật vào sendSummary()
Ví dụ summary theo từng job:
NearRealtime
DailyBackfill
WeeklySafetySweep
Mỗi summary tối thiểu nên có:
platform/shop count
from/to
fetched
processed
created
updated
failed
5. Chốt mức ưu tiên sửa
Nếu muốn làm theo thứ tự nhanh nhất, mình khuyên:
Sửa reconcile.scheduler.tsthêm daily backfill cho cả orders và returns
giữ weekly safety sweep

Sửa report statsbỏ hardcode 0

Tối ưu syncOrdersBatch()
nếu thấy daily backfill chạy chậm
6. Chốt ngắn gọn
Nếu sửa tối thiểu để an toàn hơn ngay bây giờ, thì chỉ cần:
giữ job 30 phút
thêm job 02:00 quét cả orders + returns trong 15 ngày
giữ job Chủ nhật quét sâu 30 ngày
sửa summary để phản ánh số thật
