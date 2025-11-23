// scripts/login.js

document.addEventListener('DOMContentLoaded', function() {

    // Lấy vai trò từ URL (?role=student/tutor/coordinator)
    const urlParams = new URLSearchParams(window.location.search);
    const selectedRole = urlParams.get('role');

    // Đặt tiêu đề trang và tiêu đề lớn theo vai trò
    let roleLabel = '';
    if (selectedRole === 'student') roleLabel = 'Sinh viên';
    else if (selectedRole === 'tutor') roleLabel = 'Tutor';
    else if (selectedRole === 'coordinator') roleLabel = 'Coordinator';
    else roleLabel = '';

    const loginTitle = document.getElementById('login-title');
    loginTitle.textContent = roleLabel ? `Đăng Nhập - ${roleLabel}` : 'Đăng Nhập';
    // Đặt tiêu đề tab trình duyệt
    if (roleLabel) {
        document.title = `Đăng Nhập - ${roleLabel} - TutorConnect`;
    } else {
        document.title = 'Đăng Nhập - TutorConnect';
    }

    // --- PHẦN 2: XỬ LÝ FORM ĐĂNG NHẬP ---
    const loginForm = document.getElementById('login-form-element');
    
    // Lấy các phần tử input và vùng báo lỗi
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        console.log('Đang kiểm tra đăng nhập:', { username, password });

        usernameInput.classList.remove('is-invalid');
        passwordInput.classList.remove('is-invalid');
        errorMessageDiv.innerHTML = '';

        // Lấy vai trò từ URL (?role=student/tutor/coordinator)
        const urlParams = new URLSearchParams(window.location.search);
        const selectedRole = urlParams.get('role');

        // Xác định file, role, và trang chuyển hướng tương ứng
        let source = null;
        if (selectedRole === 'student') {
            source = { file: 'stu.json', role: 'student', redirect: '/pages/student/stu-home.html' };
        } else if (selectedRole === 'tutor') {
            source = { file: 'tutor.json', role: 'tutor', redirect: '/pages/tutor/tutor-home.html' };
        } else if (selectedRole === 'coordinator') {
            source = { file: 'admin.json', role: 'coordinator', redirect: '/pages/admin/dashboard.html' };
        }

        let foundUser = null;
        let extraData = null;

        if (!source) {
            errorMessageDiv.innerHTML = '<p class="error-text">Vai trò không hợp lệ!</p>';
            return;
        }

        try {
            const response = await fetch(window.location.origin + '/api/data/' + source.file);
            if (!response.ok) throw new Error('Không thể đọc dữ liệu người dùng');
            const data = await response.json();
            if (source.role === 'coordinator') {
                // admin.json: { user: {...}, reports: [...] }
                if (data.user && data.user.username === username && data.user.password === password) {
                    foundUser = data.user;
                    extraData = data.reports || null;
                }
            } else {
                // tutor.json, stu.json: array
                const arr = Array.isArray(data) ? data : [];
                const user = arr.find(u => u.username === username && u.password === password);
                if (user) {
                    foundUser = user;
                }
            }
        } catch (err) {
            errorMessageDiv.innerHTML = '<p class="error-text">Lỗi đọc dữ liệu người dùng!</p>';
            return;
        }

        if (foundUser) {
            localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
            localStorage.setItem('userRole', source.role);
            localStorage.setItem('currentUser', foundUser.username);
            if (source.role === 'coordinator' && extraData) {
                localStorage.setItem('adminReports', JSON.stringify(extraData));
            }
            window.location.href = source.redirect;
        } else {
            usernameInput.classList.add('is-invalid');
            passwordInput.classList.add('is-invalid');
            errorMessageDiv.innerHTML = '<p class="error-text">Tài khoản hoặc mật khẩu không chính xác hoặc không đúng vai trò!</p>';
        }
    });
});