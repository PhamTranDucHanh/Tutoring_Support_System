// Đợi DOM load xong
/*document.addEventListener("DOMContentLoaded", function() {
    const searchBar = document.querySelector(".search-bar");
    const courseCards = document.querySelectorAll(".course-card");

    // Lắng nghe khi người dùng gõ vào thanh tìm kiếm
    searchBar.addEventListener("input", function() {
        const keyword = searchBar.value.toLowerCase().trim();

        courseCards.forEach(card => {
            const title = card.querySelector(".course-title").textContent.toLowerCase();

            // Nếu tiêu đề chứa từ khóa thì hiện, ngược lại ẩn
            if (title.includes(keyword)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", function() {
    const container = document.querySelector(".courses");
    const searchBar = document.querySelector(".search-bar");

    fetch("/data/courses.json")
        .then(res => res.json())
        .then(courses => {
            // render tất cả khóa học
            courses.forEach(course => {
                const card = document.createElement("a");
                card.href = "/pages/student/fill-form.html";
                card.className = "course-card";
                card.dataset.courseId = course.id;

                card.innerHTML = `
                    <img src="${course.image}" alt="${course.title}" />
                    <div class="course-title">${course.title}</div>
                    <div class="course-info">${course.desc[0]}</div>
                    <div class="course-info">Đánh giá</div>
                `;

                // lưu courseId vào localStorage khi click
                card.addEventListener("click", () => {
                    localStorage.setItem("selectedCourseId", course.id);
                });

                container.appendChild(card);
            });

            // search filter
            searchBar.addEventListener("input", function() {
                const keyword = searchBar.value.toLowerCase().trim();
                container.querySelectorAll(".course-card").forEach(card => {
                    const title = card.querySelector(".course-title").textContent.toLowerCase();
                    card.style.display = title.includes(keyword) ? "block" : "none";
                });
            });
        });
});*/
document.addEventListener("DOMContentLoaded", function() {
    const coursesContainer = document.querySelector(".courses");
    const searchBar = document.querySelector(".search-bar");

    let coursesData = [];

    // Load courses.json
    fetch("/data/courses.json")
        .then(res => res.json())
        .then(data => {
            coursesData = data;
            renderCourses(coursesData);
        })
        .catch(err => console.error("Không thể tải courses.json:", err));

    // Render courses lên giao diện
    function renderCourses(courses) {
        coursesContainer.innerHTML = ""; // Xoá nội dung cũ

        courses.forEach(course => {
            const card = document.createElement("a");
            card.classList.add("course-card");
            card.href = `/pages/student/fill-form.html?id=${course.id}`;
            card.innerHTML = `
                <img src="${course.image}" alt="${course.title}" />
                <div class="course-title">${course.title}</div>
                <div class="course-info">${course.info1}</div>
                <div class="course-info">${course.info2}</div>
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

