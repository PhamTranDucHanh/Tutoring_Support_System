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
        // Trả về kết quả của fetch để có thể dùng .then() ở nơi gọi hàm
        return fetch(filePath)
            .then(response => {
                // Nếu không tìm thấy file, ném ra lỗi để .catch() xử lý
                if (!response.ok) {
                    throw new Error(`File not found: ${filePath}`);
                }
                // Lấy nội dung text từ file
                return response.text();
            })
            .then(data => {
                // Chèn nội dung HTML vào phần tử placeholder
                element.innerHTML = data;
            })
            .catch(error => {
                console.error(`Error loading component ${filePath}:`, error);
                // Ném lỗi ra ngoài để chuỗi promise bên ngoài cũng biết là có lỗi
                throw error;
            });
    }
    // Nếu không tìm thấy phần tử placeholder, trả về một promise đã hoàn thành ngay lập tức
    // để không làm gãy chuỗi .then() ở nơi gọi hàm.
    return Promise.resolve();
}

/**
 * Thiết lập các nội dung động trên trang sau khi người dùng đăng nhập.
 * Cụ thể: Cập nhật menu người dùng và các link điều hướng trong header.
 */
function setupDynamicContent() {
    // 1. Lấy dữ liệu từ bộ nhớ trình duyệt (localStorage)
    const loggedInUserString = localStorage.getItem('loggedInUser');
    const userRole = localStorage.getItem('userRole');

    // 2. Xử lý menu dropdown của người dùng
    if (loggedInUserString) {
        const loggedInUser = JSON.parse(loggedInUserString); // Chuyển chuỗi JSON thành object
        const userNameElement = document.getElementById('user-dropdown-name');
        
        if (userNameElement) {
            // Cập nhật tên người dùng vào header
            userNameElement.textContent = loggedInUser.fullName || 'Không có tên';
        }
    }

    // 3. Xử lý nút đăng xuất
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Xóa thông tin đăng nhập
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('userRole');
            
            alert('Bạn đã đăng xuất thành công.');
            // Điều hướng về trang chọn vai trò
            window.location.href = '/index.html';
        });
    }

    // 4. Xử lý các link điều hướng động
    const homeLink = document.getElementById('home-link');
    const brandLogoLink = document.getElementById('brand-logo-link');
    const myCoursesLink = document.getElementById('my-courses-link');
    const calendarLink = document.getElementById('calendar-link');

    // Chỉ thực hiện thay đổi link nếu người dùng đã đăng nhập (có userRole)
    if (userRole) {
        let userHomePage = '#'; // Link dự phòng
        if (userRole === 'student') userHomePage = '/pages/student/stu-home.html';
        else if (userRole === 'tutor') userHomePage = '/pages/tutor/tutor-home.html';
        else if (userRole === 'coordinator') userHomePage = '/pages/admin/dashboard.html';

        // Cập nhật link "Trang chủ" và logo
        if (homeLink) homeLink.href = userHomePage;
        if (brandLogoLink) brandLogoLink.href = userHomePage;

        // Cập nhật link "Khóa học của tôi"
        if (myCoursesLink) {
            if (userRole === 'student') myCoursesLink.href = '/pages/student/my-course.html';
            else if (userRole === 'tutor') myCoursesLink.href = '/pages/tutor/my-course.html';
        }

        // Cập nhật link "Lịch"
        if (calendarLink) {
            if (userRole === 'student') calendarLink.href = '/pages/student/calendar.html';
            else if (userRole === 'tutor') calendarLink.href = '/pages/tutor/calendar.html';
        }
    }
}

/**
 * Điểm khởi đầu của script.
 * Chờ cho đến khi cấu trúc HTML của trang được tải xong hoàn toàn.
 */
document.addEventListener("DOMContentLoaded", function() {
    // --- LOGIC MỚI ĐỂ CHỌN HEADER ---

    // Lấy đường dẫn URL hiện tại của trang
    const currentPath = window.location.pathname;

    // Mặc định, chúng ta sẽ tải header chung
    let headerPath = "/pages/partials/app-header.html";
    let headerPlaceholderId = "app-header-placeholder";

    // Nếu đường dẫn chứa '/pages/admin/', có nghĩa đây là trang của Coordinator
    if (currentPath.includes("/pages/admin/")) {
        // Thay đổi đường dẫn để tải header dành riêng cho admin
        headerPath = "/pages/partials/admin-header.html";
        // Các trang admin cũng sẽ dùng chung placeholder ID này
        headerPlaceholderId = "app-header-placeholder"; 
    }

    // Tải header tương ứng đã được chọn ở trên
    loadComponent(headerPlaceholderId, headerPath)
        .then(() => {
            // SAU KHI header đã tải xong, mới chạy hàm thiết lập nội dung động.
            // Hàm này vẫn hoạt động cho cả 2 loại header vì các ID quan trọng 
            // (user-dropdown-name, logout-button) đều giống nhau.
            setupDynamicContent();
        })
        .catch(error => {
            // Bắt lỗi nếu không tải được header
            console.error("Không thể tải header:", error);
        });
    
    // Tải footer (luôn là footer chung)
    loadComponent("app-footer-placeholder", "/pages/partials/app-footer.html");
});