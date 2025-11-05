## DEADLINE 8H TỐI THỨ 2 NGÀY 10/11/2025

## Our workflow
Clone repo về -> tạo và rẽ sang nhánh mới (git checkout -b tennhanhmoi) -> hiện thực trong các file liên quan đến chức năng của mình -> commit và push nhanh cá nhân lên
repo này (git push -u origin tennhanhmoi) -> cả nhóm cùng họp để merge code theo từng giai đoạn, chạy demo và giải thích cho nhau các chức năng ở mức cơ bản.

## Cụ thể về hoàn thiện cấu trúc data (hard coded)
- Huấn, Gia Huy, Lê Huy thống nhất và hoàn thiện cách tổ chức dữ liệu của các khóa và các buổi học trong /data. (chắc vẫn nên là các file json)
- Dũng, Hưng thống nhất và hoàn thiện cách tổ chức dữ liệu cho kết quả học của sinh viên (do tutor đánh giá) + feedback dành cho tutor (do svien đánh giá) + số liệu về số học sinh, sinh viên, số khóa học... trong /data.
- Hạnh hoàn thiện cách tổ chức dữ liệu của các file tài liệu tham khảo (library) trong /data.

## Cụ thể về việc implementation
- Huấn:
  - Hoàn thiện các trang html: /pages/tutor/~~my-course.html, create-course.html, create-session.html, manange-sessions.html.
  - Hoàn thiện file CSS tương ứng cho các trang html trên: /styles/tutor/~~my-course.css, create-course.css, create-session.css, manange-sessions.css  (cho nó ra các trang tương đối giống với trên figma)
  - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu:  /scripts/tutor/~~my-course.js, create-course.js, create-session.js, manange-sessions.js .
- Gia Huy:
   - Hoàn thiện các trang html: /pages/student/~~ register-course.html, fill-form.html
   - Hoàn thiện file CSS tương ứng cho các trang html trên: /styles/student/~~register-course.css, fill-form.css  (cho nó ra các trang tương đối giống với trên figma)
   - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu:  /scripts/student/~~register-course.js, fill-form.js .
- Lê Huy:
   - Hoàn thiện các trang html: /pages/student/~~my-course.html, course-detail.html.
   - Hoàn thiện file CSS tương ứng cho các trang html trên: /styles/student/~~my-course.css, course-detail.css  (cho nó ra các trang tương đối giống với trên figma)
   - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu:  /scripts/student/~~my-course.js, course-detail.js .
- Dũng:
   - Hoàn thiện các trang html: /pages/student/student-feedback.html, /pages/tutor/tutor-feedback.html.
   - Hoàn thiện file CSS tương ứng cho các trang html trên:  /styles/student/student-feedback.css, /styles/tutor/tutor-feedback.css. (cho nó ra các trang tương đối giống với trên figma)
   - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu: /scripts/student/student-feedback.js, /scripts/tutor/tutor-feedback.js.
- Hưng:
   - Hoàn thiện các trang html: /pages/admin/~~dashboard.html, report-analyze.html, statistic-main.html, statistic-cmp.html.
   - Hoàn thiện file CSS tương ứng cho các trang html trên: /styles/admin/~~dashboard.css, report-analyze.css, statistic-main.css, statistic-cmp.css. (cho nó ra các trang tương đối giống với trên figma)
   - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu: /styles/admin/~~dashboard.js, report-analyze.js, statistic-main.js, statistic-cmp.js.
- Hạnh:
   - Hoàn thiện trang: /pages/~library.html, login.html,  /pages/student/calendar.html,  /pages/student/calendar.html.
   - Hoàn thiện file CSS tương ứng cho các trang html trên: /styles/~library.css, login.css, /styles/student/calendar.css,  /pages/student/calendar.css. (cho nó ra các trang tương đối giống với trên figma)
   - Hoàn thiện các file Javascript tương ứng để xử lý logic và dữ liệu: /scripts/~library.css, login.js, /scripts/student/calendar.js,  /scripts/student/calendar.js.
   - Hoàn thiện hơn footer và header, toggle bar các kiểu.


---
## Note 1: Logic và hiện thực nên tạch biệt vào đúng bộ 3 html/css/js của trang đó, hạn chế thay đổi bộ 3 của các trang khác và bộ 3 main (để tránh bị lỗi định dạng chung).
---
## Note 2: Giữ định dạng footer và header được injected vào các trang.
---
## Note 3: Tài khoản mật khẩu của các nick được ghi sẵn ở trong /data/, có tài khoản và mật khẩu để đăng nhập vô.
