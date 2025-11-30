# Tutor support system

## Tải và host server bằng Node.js
- Tải Node.js về máy. https://nodejs.org/en/download   --> install đầy đủ như bình thường
- Trong terminal chạy lệnh: npm install  --> để tải các đầy đủ các dependency đã được quy định trong package.json
- Sau đó chạy lệnh: node server.js   --> để host server node.js ~ chạy file server.js trong môi trường của Node.js
- Mở trình duyệt và truy cập : http://localhost:5500

## Luôn sử dụng 2 API đọc/ghi file JSON trong data/
1. Đọc file JSON (GET)
   - Endpoint: /api/data/:filename
   - Phương thức: GET
   - Ý nghĩa: Đọc nội dung file JSON bất kỳ trong thư mục data.
   - Kết quả trả về: Nội dung file JSON (kiểu mảng hoặc object).
2. Ghi/ghi đè file JSON (POST)
    - Endpoint: /api/data/:filename
    - Phương thức: POST
    - Ý nghĩa: Ghi đè nội dung file JSON bất kỳ trong thư mục data/ bằng dữ liệu gửi lên.
    - Lưu ý: Khi ghi, toàn bộ nội dung file sẽ bị thay thế bằng dữ liệu mới. Đảm bảo dữ liệu gửi lên là JSON hợp lệ.

