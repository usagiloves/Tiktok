# 🚚 Module J&T Express (Vận chuyển)

## 📖 Tổng quan
Module `jt-express` cung cấp cầu nối giao tiếp với hệ thống của đơn vị vận chuyển J&T Express. Phục vụ đắc lực cho việc tracking (theo dõi) hành trình của các kiện hàng Hoàn/Trả (Đặc biệt là Giao hàng thất bại).

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `jt-express.client.ts`
- **Chức năng**: Gọi API của J&T.
- Cung cấp các hàm để tra cứu mã vận đơn (Waybill) nhằm lấy thông tin: Hàng đã về kho chưa? Bưu tá nào đang giữ? Có sự cố gì trên đường không?

### 2. `jt-express.mapper.ts`
- **Chức năng**: Dịch các mã trạng thái nội bộ của J&T (VD: Mã sự cố phát, mã trung chuyển) thành trạng thái phổ thông dễ hiểu để hiển thị lên Lark.

## 🔄 Luồng hoạt động (Data Flow)
Module `failed-delivery` khi phát hiện một đơn bị Giao hàng thất bại sẽ gọi sang Module này. Chuyền mã Vận đơn cho nó để nó thay mặt hệ thống hỏi J&T: "Ê kiện hàng này đã nhập kho trả hàng của Shop chưa?". Nếu J&T báo CÓ kèm theo thời gian, dữ liệu sẽ được ghi nhận làm `warehouseReceivedAt`.

## ⚠️ Lưu ý quan trọng
- API của J&T yêu cầu mã hóa chuỗi truy vấn (Digest/Signature). Logic này nằm gọn trong client.
- Module này thường xuyên phải đối mặt với độ trễ (delay) từ hệ thống của đơn vị vận chuyển. Vì vậy không gọi liên tục để tránh lãng phí, chỉ nên tích hợp vào luồng Cronjob quét định kỳ (mỗi đêm).
