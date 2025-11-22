// scripts/student/fill-form.js
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    const courseTitleEl = document.querySelector(".course-title");
    //const courseDescEl = document.querySelector(".course-desc");
    const courseDescEl = document.getElementById("course-desc-container");
    const tutorInfoEl = document.getElementById("tutorInfo");
    const courseMetaCardEl = document.querySelector(".course-meta-card");
    //const registeredEl = document.querySelector(".course-desc.registered");
    const registeredEl = document.getElementById("registered");

    fetch("/data/courses.json")
        .then(res => res.json())
        .then(courses => {
            const course = courses.find(c => c.id === courseId);
            if (!course) {
                alert("Không tìm thấy khóa học!");
                return;
            }

            // Cập nhật title và desc
            if (courseTitleEl) courseTitleEl.textContent = course.title;
            if (courseDescEl) courseDescEl.innerHTML = course.description;

            // Cập nhật tổng đăng ký
           
            //const totalRegistered = course.tutors.reduce((sum, t) => sum + (t.registered || 0), 0);
                
            const tutorModal = new bootstrap.Modal(document.getElementById('tutorModal'));
            const tutorListEl = document.getElementById("tutorList");

            let selectedTutor = course.tutors[0];
               // Hiển thị tổng đăng ký ngay dưới tutor
            if (registeredEl) {
                registeredEl.innerHTML = `<p><b>${selectedTutor.registered || 0}</b> sinh viên đã đăng ký khóa học này.</p>`;
            }

            // Hiển thị tutor mặc định (đầu tiên)
            
            if (tutorInfoEl) {
                tutorInfoEl.innerHTML = `
                    <span><strong>Tutor:</strong> ${selectedTutor.name}</span>
                `;
            }

            // Hiển thị course-meta-card với tutor đầu tiên
            if (courseMetaCardEl) {
                courseMetaCardEl.innerHTML = `
                    <div class="course-meta-item">
                        <p><b>${selectedTutor.rating}<i class="fa fa-star"></i> <br>(${selectedTutor.reviews} đánh giá)</b></p>
                    </div>
                    <div class="course-meta-item">
                        <p><b>Cấp độ ${course.level}</b></p>
                    </div>
                    <div class="course-meta-item">
                        <p><b>Lịch trình linh hoạt <br> ${course.duration}</b></p>
                    </div>
                `;
            }

            // Tạo danh sách tutor trong modal
            if (tutorListEl) {
                tutorListEl.innerHTML = "";
                course.tutors.forEach(t => {
                    const li = document.createElement("li");
                    li.classList.add("list-group-item", "tutor-item");
                    li.innerHTML = `
                        ${t.name} 
                    `;
                    tutorListEl.appendChild(li);
                });

                // Thêm mục ngẫu nhiên
                const randomLi = document.createElement("li");
                randomLi.classList.add("list-group-item", "tutor-item");
                randomLi.textContent = "Ngẫu nhiên";
                tutorListEl.appendChild(randomLi);
            }

            // Mở modal khi click vào tutorInfo
            if (tutorInfoEl) {
                tutorInfoEl.addEventListener("click", () => tutorModal.show());
            }

            // Chọn tutor từ danh sách
            if (tutorListEl) {
                tutorListEl.addEventListener("click", function(e) {
                    if (e.target && e.target.classList.contains("tutor-item")) {
                        let name = e.target.textContent;
                        if (name === "Ngẫu nhiên") {
                            const tutors = course.tutors;
                            selectedTutor = tutors[Math.floor(Math.random() * tutors.length)];
                        } else {
                            selectedTutor = course.tutors.find(t => name.includes(t.name)) || course.tutors[0];
                        }

                        // Cập nhật tutorInfo
                        if (tutorInfoEl) {
                            tutorInfoEl.innerHTML = `
                                <span><strong>Tutor:</strong> ${selectedTutor.name}</span>
                            `;
                        }

                        // Cập nhật course-meta-card
                        if (courseMetaCardEl) {
                            courseMetaCardEl.querySelector(".course-meta-item p").innerHTML =
                                `<b>${selectedTutor.rating}<i class="fa fa-star"></i> <br>(${selectedTutor.reviews} đánh giá)</b>`;
                        }
                        if (registeredEl) {
                            registeredEl.innerHTML = `<p><b>${selectedTutor.registered || 0}</b> sinh viên đã đăng ký với tutor này.</p>`;
                        }      

                        tutorModal.hide();
                    }
                });
            }

        })
        .catch(err => {
            console.error("Đã xảy ra lỗi khi tải dữ liệu khóa học.", err);
            alert("Đã xảy ra lỗi khi tải dữ liệu khóa học.");
        });
});

document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("registerForm");
    const modal = new bootstrap.Modal(document.getElementById("registerModal"));
    const modalBody = document.getElementById("registerModalBody");

    registerForm.addEventListener("submit", function(e) {
        e.preventDefault(); // Ngăn submit mặc định

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const studentYear = document.getElementById("course").value.trim(); // Đây là khóa sinh viên

        // Regex cơ bản kiểm tra ký tự: chỉ chữ và khoảng trắng cho họ tên
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let errorMessages = [];

        if (!name || !nameRegex.test(name)) {
            errorMessages.push("Họ và tên không hợp lệ (chỉ chứa chữ và khoảng trắng).");
        }
        if (!email || !emailRegex.test(email)) {
            errorMessages.push("Email không hợp lệ.");
        }
        if (!studentYear) {
            errorMessages.push("Vui lòng nhập khoá sinh viên (ví dụ K23).");
        }

        if (errorMessages.length > 0) {
            modalBody.innerHTML = errorMessages.join("<br>");
            modal.show();
        } else {
            // Đăng ký thành công
            const tutorName = document.querySelector(".tutor-info span").textContent.replace("Tutor: ", "").trim();
            const courseTitleElement = document.querySelector(".course-title");
            const courseTitle = courseTitleElement ? courseTitleElement.textContent.trim() : "Khoá học này";

            modalBody.innerHTML = `<b>Đăng ký thành công!</b><br>Bạn đã đăng ký khoá học "<b>${courseTitle}</b>" thành công với <b>${tutorName}</b>.`;
            modal.show();

            // Khi click OK sẽ chuyển về trang đăng ký môn học
            const modalOkBtn = document.getElementById("modalOkBtn");
            modalOkBtn.onclick = function() {
                window.location.href = "register-course.html";
            };
        }
    });
});






