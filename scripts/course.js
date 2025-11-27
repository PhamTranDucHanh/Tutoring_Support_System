// scripts/course.js
document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('coursesList');
    const detailModal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    const modalTitle = document.getElementById('courseDetailModalLabel');
    const modalBody = document.getElementById('courseDetailModalBody');

    let coursesData = []; // Lưu trữ dữ liệu các khóa học

    async function fetchAndDisplayCourses() {
        try {
            const response = await fetch('/api/data/courses.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            coursesData = await response.json();
            listContainer.innerHTML = '';

            if (!coursesData || coursesData.length === 0) {
                listContainer.innerHTML = '<div class="alert alert-info">Hiện tại chưa có khóa học nào trong hệ thống.</div>';
                return;
            }
            
            coursesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const palette = ['#f7c6c7', '#a8c8ff', '#ffb5a7', '#c7f0d6', '#f3e9a9', '#d1c4e9', '#b2dfdb'];

            coursesData.forEach((course, index) => {
                const courseItem = document.createElement('div'); // Thay <a> bằng <div>
                courseItem.className = 'list-group-item list-group-item-action d-flex align-items-center course-item';
                courseItem.setAttribute('data-course-id', course.id); // Dùng data attribute để xác định course
                
                // Thêm event listener để mở modal
                courseItem.addEventListener('click', () => {
                    displayCourseDetails(course.id);
                });

                const badge = document.createElement('div');
                badge.className = 'course-badge';
                badge.style.backgroundColor = palette[index % palette.length];

                const content = document.createElement('div');
                content.className = 'ms-3 me-auto';
                const title = document.createElement('div');
                title.className = 'fw-bold';
                title.textContent = course.title || `Khóa học ${course.id}`;
                const description = document.createElement('p');
                description.className = 'small text-muted mb-0';
                const descText = course.description || 'Không có mô tả.';
                description.textContent = descText.length > 120 ? `${descText.slice(0, 120)}...` : descText;
                content.appendChild(title);
                content.appendChild(description);

                const rightInfo = document.createElement('div');
                rightInfo.className = 'text-end small ms-3';
                const sessionsPerWeek = course.sessionsPerWeek || 0;
                const durationMonths = course.durationMonths || '?';
                rightInfo.innerHTML = `
                    <div>${sessionsPerWeek} buổi/tuần</div>
                    <div>${durationMonths} tháng</div>
                `;

                courseItem.appendChild(badge);
                courseItem.appendChild(content);
                courseItem.appendChild(rightInfo);
                listContainer.appendChild(courseItem);
            });

        } catch (error) {
            console.error('Failed to fetch courses:', error);
            listContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách khóa học. Vui lòng thử lại sau.</div>';
        }
    }

    function displayCourseDetails(courseId) {
        const course = coursesData.find(c => c.id === courseId);
        if (!course) return;

        // Cập nhật tiêu đề modal
        modalTitle.textContent = course.title;

        // Tạo nội dung cho body modal
        let bodyHtml = `
            <p>${course.description || 'Không có mô tả chi tiết.'}</p>
            <hr>
            <h6><i class="fa-solid fa-chalkboard-user me-2"></i>Gia sư phụ trách</h6>
        `;

        if (course.tutors && course.tutors.length > 0) {
            course.tutors.forEach(tutor => {
                bodyHtml += `
                    <div class="tutor-info mb-3">
                        <i class="fa-solid fa-circle-user"></i>
                        <div>
                            <div class="fw-bold">${tutor.name}</div>
                            <div class="small text-muted">Đánh giá: ${tutor.rating} <i class="fa-solid fa-star text-warning"></i> (${tutor.reviews} lượt)</div>
                        </div>
                    </div>
                `;
            });
        } else {
            bodyHtml += '<p class="text-muted">Chưa có thông tin gia sư.</p>';
        }

        bodyHtml += `<hr><h6><i class="fa-solid fa-calendar-days me-2"></i>Các buổi học</h6>`;

        if (course.sessions && course.sessions.length > 0) {
            bodyHtml += '<ul class="list-group list-group-flush">';
            course.sessions.forEach(session => {
                bodyHtml += `
                    <li class="list-group-item">
                        <div class="fw-bold">${session.topic}</div>
                        <div class="small text-muted">
                            <i class="fa-regular fa-clock me-1"></i> ${session.date} | ${session.start} - ${session.end}
                        </div>
                        <div class="small text-muted">
                            <i class="fa-solid fa-location-dot me-1"></i> ${session.location} (${session.mode})
                        </div>
                    </li>
                `;
            });
            bodyHtml += '</ul>';
        } else {
            bodyHtml += '<p class="text-muted">Chưa có lịch học cụ thể.</p>';
        }

        modalBody.innerHTML = bodyHtml;

        // Hiển thị modal
        detailModal.show();
    }

    fetchAndDisplayCourses();
});