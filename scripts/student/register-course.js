/*document.addEventListener("DOMContentLoaded", function() {
    const coursesContainer = document.querySelector(".courses");
    const searchBar = document.querySelector(".search-bar");

    let coursesData = [];

    // Load danh sách khóa học từ API (chuẩn REST)
    fetch("/api/data/courses.json")
        .then(res => res.json())
        .then(data => {
            coursesData = Array.isArray(data) ? data : [];
            renderCourses(coursesData);
        })
        .catch(err => {
            coursesContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách khóa học.</div>';
            console.error("Không thể tải courses.json:", err);
        });

    // Render danh sách khóa học lên giao diện
    function renderCourses(courses) {
        coursesContainer.innerHTML = "";
        if (!courses.length) {
            coursesContainer.innerHTML = '<div class="alert alert-info">Chưa có khóa học nào trong hệ thống.</div>';
            return;
        }
        courses.forEach(course => {
            const card = document.createElement("a");
            card.classList.add("course-card");
            card.href = `/pages/student/fill-form.html?id=${course.id}`;
            card.innerHTML = `
                <img src="${course.image}" alt="${course.title}" />
                <div class="course-title">${course.title}</div>
                <div class="course-info">${course.info1 || ''}</div>
                <div class="course-info">${course.info2 || ''}</div>
            `;
            coursesContainer.appendChild(card);
        });
    }

    // Tìm kiếm theo từ khoá
    searchBar.addEventListener("input", function() {
        const keyword = searchBar.value.toLowerCase().trim();
        const filtered = coursesData.filter(course => course.title.toLowerCase().includes(keyword));
        renderCourses(filtered);
    });
});*/
document.addEventListener("DOMContentLoaded", function () {
    const coursesContainer = document.querySelector(".courses");
    const searchBar = document.querySelector(".search-bar");

    let coursesData = [];
    let loggedInUser = null;
    let registeredCourseIds = [];

    // Lấy sinh viên hiện tại từ localStorage
    try {
        loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser && loggedInUser.username) {
            // Đọc stu.json để lấy danh sách khóa học đã đăng ký
            fetch("/api/data/stu.json")
                .then(res => res.json())
                .then(students => {
                    const student = students.find(s => s.username === loggedInUser.username);
                    if (student && Array.isArray(student.registeredCourses)) {
                        registeredCourseIds = student.registeredCourses.map(rc => rc.courseId);
                    }
                    loadCourses(); // Chỉ load courses sau khi có registeredCourseIds
                })
                .catch(err => {
                    console.error("Không thể đọc stu.json:", err);
                    loadCourses(); // Load bình thường nếu lỗi
                });
        } else {
            loadCourses(); // Không có loggedInUser, load bình thường
        }
    } catch (e) {
        console.error("Lỗi đọc localStorage:", e);
        loadCourses(); // Load bình thường nếu lỗi
    }

    // Hàm load danh sách khóa học
    function loadCourses() {
        fetch("/api/data/courses.json")
            .then(res => res.json())
            .then(data => {
                coursesData = Array.isArray(data) ? data : [];
                renderCourses(coursesData);
            })
            .catch(err => {
                coursesContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách khóa học.</div>';
                console.error("Không thể tải courses.json:", err);
            });
    }

    // Render danh sách khóa học lên giao diện
    function renderCourses(courses) {
        coursesContainer.innerHTML = "";
        if (!courses.length) {
            coursesContainer.innerHTML = '<div class="alert alert-info">Chưa có khóa học nào trong hệ thống.</div>';
            return;
        }

        // Lọc ra những khóa học chưa đăng ký
        const availableCourses = courses.filter(c => !registeredCourseIds.includes(c.id));

        if (!availableCourses.length) {
            coursesContainer.innerHTML = '<div class="alert alert-info">Bạn đã đăng ký tất cả các khóa học hiện có.</div>';
            return;
        }

        availableCourses.forEach(course => {
            const card = document.createElement("a");
            card.classList.add("course-card");
            card.href = `/pages/student/fill-form.html?id=${course.id}`;
            card.innerHTML = `
                <img src="${course.image}" alt="${course.title}" />
                <div class="course-title">${course.title}</div>
                <div class="course-info">${course.info1 || ''}</div>
                <div class="course-info">${course.info2 || ''}</div>
            `;
            coursesContainer.appendChild(card);
        });
    }

    // Tìm kiếm theo từ khoá
    searchBar.addEventListener("input", function () {
        const keyword = searchBar.value.toLowerCase().trim();
        const filtered = coursesData.filter(course => course.title.toLowerCase().includes(keyword));
        renderCourses(filtered);
    });
});


