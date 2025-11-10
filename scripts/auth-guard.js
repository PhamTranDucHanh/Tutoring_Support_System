// scripts/auth-guard.js

(function() {
    // Tự động thực thi ngay khi script được tải

    // 1. Lấy thông tin đăng nhập từ localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userRole = localStorage.getItem('userRole');
    const currentPath = window.location.pathname;

    // 2. Kiểm tra xem người dùng đã đăng nhập chưa
    if (!loggedInUser || !userRole) {
        // Nếu chưa đăng nhập, chuyển hướng họ về trang chọn vai trò
        alert('Bạn cần đăng nhập để truy cập trang này.');
        window.location.href = '/index.html';
        return; // Dừng thực thi để tránh lỗi
    }

    // 3. Kiểm tra xem người dùng có đúng vai trò để truy cập trang hiện tại không
    let isAuthorized = false;
    if (userRole === 'student' && currentPath.includes('/pages/student/')) {
        isAuthorized = true;
    } else if (userRole === 'tutor' && currentPath.includes('/pages/tutor/')) {
        isAuthorized = true;
    } else if (userRole === 'coordinator' && currentPath.includes('/pages/admin/')) {
        isAuthorized = true;
    }

    // Các trang chung mà tất cả các vai trò đều có thể truy cập
    const commonPages = ['/pages/library.html', '/pages/course.html'];
    if (commonPages.includes(currentPath)) {
        isAuthorized = true;
    }

    // 4. Nếu không được phép, chuyển hướng về trang chủ đúng vai trò của họ
    if (!isAuthorized) {
        alert('Bạn không có quyền truy cập vào trang này.');
        
        let homePage = '/index.html'; // Trang dự phòng
        if (userRole === 'student') {
            homePage = '/pages/student/stu-home.html';
        } else if (userRole === 'tutor') {
            homePage = '/pages/tutor/tutor-home.html';
        } else if (userRole === 'coordinator') {
            homePage = '/pages/admin/dashboard.html';
        }
        window.location.href = homePage;
    }

})(); // IIFE - Immediately Invoked Function Expression