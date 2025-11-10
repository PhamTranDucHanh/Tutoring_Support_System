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
        window.location.href = '/index.html';
        return;
    }

    loginTitle.textContent = `Đăng Nhập - ${roleText}`;

    // --- PHẦN 2: XỬ LÝ FORM ĐĂNG NHẬP ---
    const loginForm = document.getElementById('login-form-element');
    
    // Lấy các phần tử input và vùng báo lỗi
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Lấy giá trị từ các biến đã được khai báo ở trên
        const username = usernameInput.value;
        const password = passwordInput.value;

        // Xóa trạng thái lỗi cũ trước mỗi lần thử đăng nhập
        usernameInput.classList.remove('is-invalid');
        passwordInput.classList.remove('is-invalid');
        errorMessageDiv.innerHTML = '';

        fetch(dataFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải file dữ liệu.');
                }
                return response.json();
            })
            .then(users => {
                const foundUser = users.find(user => user.username === username && user.password === password);

                if (foundUser) {
                    // Đăng nhập thành công, không cần alert
                    localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                    localStorage.setItem('userRole', role);
                    window.location.href = redirectUrl;
                } else {
                    // Đăng nhập thất bại: Thay thế alert()
                    // 1. Thêm class is-invalid để làm đỏ viền input
                    usernameInput.classList.add('is-invalid');
                    passwordInput.classList.add('is-invalid');

                    // 2. Hiển thị thông báo lỗi
                    errorMessageDiv.innerHTML = '<p class="error-text">Tài khoản hoặc mật khẩu không chính xác!</p>';
                }
            })
            .catch(error => {
                console.error('Đã xảy ra lỗi:', error);
                // Hiển thị lỗi hệ thống trên UI
                errorMessageDiv.innerHTML = '<p class="error-text">Đã có lỗi xảy ra. Vui lòng thử lại.</p>';
            });
    });
});