// scripts/login.js

document.addEventListener('DOMContentLoaded', function() {

    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const loginTitle = document.getElementById('login-title');

    // --- PHẦN 1: XÁC ĐỊNH FILE DATA VÀ TRANG ĐÍCH DỰA TRÊN VAI TRÒ ---
    let dataFile = '';
    let redirectUrl = '';
    let roleText = '';

    if (role === 'student') {
        dataFile = '/data/stu.json';
        redirectUrl = '/pages/student/stu-home.html';
        roleText = 'Sinh Viên';
    } else if (role === 'tutor') {
        dataFile = '/data/tutor.json';
        redirectUrl = '/pages/tutor/tutor-home.html';
        roleText = 'Tutor';
    } else if (role === 'coordinator') {
        dataFile = '/data/admin.json';
        redirectUrl = '/pages/admin/dashboard.html';
        roleText = 'Coordinator';
    } else {
        // Nếu không có vai trò, quay về trang chọn vai trò
        window.location.href = '/index.html';
        return; // Dừng thực thi script
    }

    // Cập nhật tiêu đề trang đăng nhập
    loginTitle.textContent = `Đăng Nhập - ${roleText}`;

    // --- PHẦN 2: XỬ LÝ FORM ĐĂNG NHẬP ---
    const loginForm = document.getElementById('login-form-element');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // === LOGIC MỚI: ĐỌC FILE JSON VÀ XÁC THỰC ===
        fetch(dataFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải file dữ liệu.');
                }
                return response.json();
            })
            .then(users => {
                // Tìm người dùng trong mảng dữ liệu
                const foundUser = users.find(user => user.username === username && user.password === password);

                if (foundUser) {
                    // Nếu tìm thấy người dùng
                    alert('Đăng nhập thành công!');
                    
                    // Lưu thông tin người dùng vào localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                    localStorage.setItem('userRole', role);

                    // Chuyển hướng đến trang tương ứng
                    window.location.href = redirectUrl;
                } else {
                    // Nếu không tìm thấy
                    alert('Tài khoản hoặc mật khẩu không chính xác!');
                }
            })
            .catch(error => {
                // Xử lý lỗi (ví dụ: file data không tồn tại)
                console.error('Đã xảy ra lỗi:', error);
                alert('Đã có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.');
            });
    });
});