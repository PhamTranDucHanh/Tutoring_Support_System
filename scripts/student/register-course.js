document.addEventListener("DOMContentLoaded", function() {
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
});

