## Những thay đổi
- Phần của Lê Huy: Bỏ logic xóa luôn session khi xin vắng thành công, thay bằng ghi một object đơn xin nghỉ vào absence-requests.json. Thêm pop up thông báo gửi đơn xin nghỉ thành công. Trang course-detail ở trường Giảng viên hiển thị tên giảng viên thay vì ID
- Phần của Dũng: Thêm pop up thông báo gửi feedback và evaluation thành công.
- Phần của  Gia Huy: căn lại UI (thẳng lề với footer và header) trong trang fill-form.html

## Our workflow
- (đứng ở nhánh main: git checkout main) git pull origin main 
- git checkout -b nhánh_mới_hoàn_toàn (hoặc git checkout nhánh_cá_nhân_cũ nếu muốn dùng lại tên nhánh cũ)
- "làm, thay đổi và sửa code thoải mái" xong thì commit
- git push origin nhánh_mới_hoàn_toàn (hoặc git checkout nhánh_cá_nhân_cũ nếu muốn dùng lại tên nhánh cũ)
- "đợi đến ngày deadline rồi cả nhóm cùng merge lại"

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

## Cụ thể về việc implementation
- Huấn:
  - Hoàn thiện nốt logic phần manage-session
  - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.
- Gia Huy:
  - Sửa trang fill-form lại (lược bớt)
  - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.
- Lê Huy:
  - Bỏ chức năng hủy buổi học.
  - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.
- Dũng:
  - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.
- Hưng:
   - Sử dụng dữ liệu từ 3 file : stu-feedback.json, tutor-evaluate.json, sys-stat, để hiển thị dữ liệu một cách trực quan và đẹp nhất.
   - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.
- Hạnh:
   - Thêm lịch cho tutor và student, hoàn thiện chức năng thông báo, nhắc hẹn
   - Hoàn thiện thêm UI trang ứng với chức năng của mình và fix bug.


---
## Note 1: Logic và hiện thực nên tạch biệt vào đúng bộ 3 html/css/js của trang đó, hạn chế thay đổi bộ 3 của các trang khác và bộ 3 main (để tránh bị lỗi định dạng chung).
---
## Note 2: Giữ định dạng footer và header được injected vào các trang.
---
## Note 3: Tài khoản mật khẩu của các nick được ghi sẵn ở trong /data/, có tài khoản và mật khẩu để đăng nhập vô.
---
## Note 4: Luôn tương tác với các file json qua 2 API đọc và ghi ở trên, chỉ nên thêm các thuộc tính vào đối tượng json, KHÔNG: xóa, đổi tên, làm trùng lặp logic với các thuộc tính hiện có của các đối tượng trong các file json trong thư mục data/.
