# 🐦 Module Lark (Giao tiếp Lark Base & Bot)

## 📖 Tổng quan
Module `lark` đóng vai trò là "Tay sai" thực thi cuối cùng của hệ thống. Nó chịu trách nhiệm đẩy dữ liệu đã được xử lý xong lên giao diện bảng tính Lark Base để nhân sự thao tác. Đồng thời, nó cũng cung cấp công cụ bắn tin nhắn cảnh báo qua Lark Bot.

## 📂 Chi tiết các file và Hàm quan trọng

### 1. `lark-api.client.ts`
- **Chức năng**: Lớp bao bọc giao tiếp với Lark Open API.
- **Hàm `getTenantAccessToken()`**: Kéo Token định danh để có quyền truy cập vào Lark Base của tổ chức.
- **Hàm `createRecord()` & `updateRecord()`**: Bắn payload lên Lark để tạo dòng mới hoặc cập nhật dòng cũ.

### 2. `lark-record.service.ts`
- **Chức năng**: Quản lý Bộ đệm Ánh xạ (Mapping Cache).
- Dùng bảng `lark_records` trong Database để nhớ xem mã Đơn hàng (hoặc Trả hàng) này đã từng được đưa lên Lark chưa, và ID của dòng đó (Record ID) trên Lark là gì.
- **Tại sao cần?** Nếu không có file này, mỗi lần muốn cập nhật 1 đơn hàng, hệ thống sẽ phải quét cả bảng Lark (tốn 2s/đơn). Nhờ cache nội bộ, việc tìm kiếm giảm xuống chỉ còn O(1) (~0.001s).

### 3. `lark-bot.service.ts`
- **Chức năng**: Gửi tin nhắn Markdown vào Group Chat.
- **Sử dụng**: Dùng để gửi Báo cáo Tổng kết hàng ngày (Daily Summary) hoặc cảnh báo lỗi khẩn cấp (Alerts).

## 🔄 Luồng hoạt động (Data Flow)
1. `sync-engine` chuẩn bị xong Payload. Nó gọi `lark-record.service` hỏi: "Mày biết Record ID của Đơn này không?"
2. Nếu Không: Gọi `lark-api.createRecord()`, lấy Record ID mới trả về lưu lại vào DB.
3. Nếu Có: Lấy Record ID, gọi `lark-api.updateRecord()` để chèn dữ liệu mới vào đúng dòng đó.

## ⚠️ Lưu ý quan trọng
- Khi thay đổi Cột (Field) trên Lark Base (Đổi tên, đổi kiểu dữ liệu), bạn phải vào file quy định Payload của hệ thống để sửa lại mã Field ID tương ứng. Nếu gửi sai định dạng, Lark API sẽ báo lỗi `Invalid Schema` và ngừng đồng bộ Đơn hàng đó.
