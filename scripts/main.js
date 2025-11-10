// scripts/main.js

/**
 * Tải nội dung của một file HTML (component) và chèn vào một phần tử trên trang.
 * @param {string} elementId - ID của phần tử placeholder (ví dụ: 'app-header-placeholder').
 * @param {string} filePath - Đường dẫn đến file HTML cần tải.
 * @returns {Promise} - Một Promise sẽ hoàn thành khi component đã được tải và chèn xong.
 */
function loadComponent(elementId, filePath) {
    const element = document.getElementById(elementId);
    if (element) {
        return fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`File not found: ${filePath}`);
                }
                return response.text();
            })
            .then(data => {
                element.innerHTML = data;
            })
            .catch(error => {
                console.error(`Error loading component ${filePath}:`, error);
                throw error;
            });
    }
    return Promise.resolve();
}

/**
 * Thiết lập các nội dung động trên trang sau khi người dùng đăng nhập.
 * Cụ thể: Cập nhật menu người dùng và các link điều hướng trong header.
 */
function setupDynamicContent() {
    const loggedInUserString = localStorage.getItem('loggedInUser');
    const userRole = localStorage.getItem('userRole');

    // Nếu không có thông tin người dùng, không làm gì cả.
    // auth-guard.js đã xử lý việc chuyển hướng.
    if (!loggedInUserString || !userRole) {
        return;
    }

    // 2. Xử lý menu dropdown của người dùng
    const loggedInUser = JSON.parse(loggedInUserString);
    const userNameElement = document.getElementById('user-dropdown-name');
    if (userNameElement) {
        userNameElement.textContent = loggedInUser.fullName || 'Không có tên';
    }

    // 3. Xử lý nút đăng xuất
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        const logoutModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));
        logoutButton.addEventListener('click', function() {
            logoutModal.show();
        });

        const confirmLogoutButton = document.getElementById('confirm-logout-button');
        if (confirmLogoutButton) {
            confirmLogoutButton.addEventListener('click', function() {
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('userRole');
                logoutModal.hide();
                window.location.href = '/index.html';
            });
        }
    }

    // 4. Xử lý các link điều hướng động
    const homeLink = document.getElementById('home-link');
    const brandLogoLink = document.getElementById('brand-logo-link');
    const myCoursesLink = document.getElementById('my-courses-link');
    const calendarLink = document.getElementById('calendar-link');

    let userHomePage = '#';
    if (userRole === 'student') userHomePage = '/pages/student/stu-home.html';
    else if (userRole === 'tutor') userHomePage = '/pages/tutor/tutor-home.html';
    else if (userRole === 'coordinator') userHomePage = '/pages/admin/dashboard.html';

    if (homeLink) homeLink.href = userHomePage;
    if (brandLogoLink) brandLogoLink.href = userHomePage;

    if (myCoursesLink) {
        if (userRole === 'student') myCoursesLink.href = '/pages/student/my-course.html';
        else if (userRole === 'tutor') myCoursesLink.href = '/pages/tutor/my-course.html';
    }

    if (calendarLink) {
        if (userRole === 'student') calendarLink.href = '/pages/student/calendar.html';
        else if (userRole === 'tutor') calendarLink.href = '/pages/tutor/calendar.html';
    }
}

/**
 * Điểm khởi đầu của script.
 */
document.addEventListener("DOMContentLoaded", function() {
    // Kiểm tra xem người dùng có đăng nhập không trước khi tải components
    if (!localStorage.getItem('loggedInUser')) {
        // Nếu không đăng nhập, không cần tải header/footer
        return;
    }

    const currentPath = window.location.pathname;
    let headerPath = "/pages/partials/app-header.html";
    let headerPlaceholderId = "app-header-placeholder";

    if (currentPath.includes("/pages/admin/")) {
        headerPath = "/pages/partials/admin-header.html";
    }

    Promise.all([
        loadComponent(headerPlaceholderId, headerPath),
        loadComponent("app-footer-placeholder", "/pages/partials/app-footer.html")
    ]).then(() => {
        setupDynamicContent();
    }).catch(error => {
        console.error("Không thể tải header hoặc footer:", error);
    });
});