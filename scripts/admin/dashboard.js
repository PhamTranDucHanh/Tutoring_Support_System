document.addEventListener('DOMContentLoaded', async function () {

    const tableBody = document.querySelector('#reportTable tbody');
    const paginationInfo = document.querySelector('.pagination-info');

    // Hàm định dạng ngày giờ
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const time = date.toTimeString().slice(0, 8);
        return `${time} ${day}/${month}/${year}`;
    }

    // Render 1 dòng thống kê hệ thống
    function renderStatRow(stat) {
        const tr = document.createElement('tr');
        tr.dataset.code = stat.id;
        tr.dataset.type = 'Thống kê';
        tr.innerHTML = `
            <td class="ps-4"><strong>${stat.id}</strong></td>
            <td>Thống kê hệ thống</td>
            <td>${formatDate(stat.updatedAt)}</td>
            <td><span class="badge stats">Thống kê</span></td>
            <td class="text-center">
                Số khóa học: <strong>${stat.numCourses}</strong>,
                Số sinh viên: <strong>${stat.numStudents}</strong>,
                Số buổi học: <strong>${stat.numSessions}</strong>,
                Số gia sư: <strong>${stat.numTutors}</strong>
            </td>
        `;
        return tr;
    }

    // Tải và hiển thị danh sách thống kê hệ thống từ sys-stat.json qua API
    async function loadSystemStats() {
        try {
            const response = await fetch('/api/data/sys-stat.json');
            if (!response.ok) throw new Error('Không tải được số liệu hệ thống');
            const statsArr = await response.json();
            tableBody.innerHTML = '';
            if (!Array.isArray(statsArr) || statsArr.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có số liệu hệ thống</td></tr>';
                paginationInfo.innerHTML = 'Hiển thị <strong>0</strong> kết quả';
            } else {
                statsArr.slice().reverse().forEach(stat => {
                    tableBody.appendChild(renderStatRow(stat));
                });
                paginationInfo.innerHTML = `Hiển thị <strong>1</strong> đến <strong>${statsArr.length}</strong> của <strong>${statsArr.length}</strong> kết quả`;
            }
        } catch (error) {
            console.error('Lỗi:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải số liệu hệ thống!</td></tr>`;
        }
    }

    // Chạy ngay khi load trang
    loadSystemStats();

    // ==========================
    // DEMO LOGIC: Thêm/tìm báo cáo demo
    // ==========================


    // Hàm cập nhật số liệu hệ thống vào sys-stat.json (giữ nguyên logic cập nhật)
    async function updateSystemStats() {
        try {
            // Đọc dữ liệu từ các file json qua API
            const [tutorRes, stuRes, courseRes, adminRes, statRes] = await Promise.all([
                fetch('/api/data/tutor.json'),
                fetch('/api/data/stu.json'),
                fetch('/api/data/courses.json'),
                fetch('/api/data/admin.json'),
                fetch('/api/data/sys-stat.json')
            ]);
            const tutors = await tutorRes.json();
            const students = await stuRes.json();
            const courses = await courseRes.json();
            const adminData = await adminRes.json();
            let statsArr = await statRes.json();
            if (!Array.isArray(statsArr)) statsArr = [];

            // Tính số liệu
            const numCourses = Array.isArray(courses) ? courses.length : 0;
            const numStudents = Array.isArray(students) ? students.length : 0;
            let numSessions = 0;
            if (Array.isArray(courses)) {
                courses.forEach(c => {
                    if (Array.isArray(c.sessions)) numSessions += c.sessions.length;
                });
            }
            const numTutors = Array.isArray(tutors) ? tutors.length : 0;

            // Tạo đối tượng số liệu hệ thống
            const statObj = {
                id: `stat_${Date.now()}`,
                updatedAt: new Date().toISOString(),
                updatedBy: adminData.user && adminData.user.id ? adminData.user.id : '',
                numCourses,
                numStudents,
                numSessions,
                numTutors
            };

            // Thêm vào mảng sys-stat.json
            statsArr.push(statObj);
            // Ghi lại qua API
            const resp = await fetch('/api/data/sys-stat.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statsArr)
            });
            if (resp.ok) {
                // Hiển thị thông báo thành công
                const msg = document.createElement('div');
                msg.textContent = 'Đã cập nhật số liệu hệ thống thành công!';
                msg.style = 'color:#0BB965;font-weight:500;text-align:center;margin:16px 0;';
                document.querySelector('.center-content').prepend(msg);
                setTimeout(() => msg.remove(), 3000);
                // Reload lại bảng thống kê
                loadSystemStats();
            } else {
                alert('Lỗi khi ghi số liệu hệ thống!');
            }
        } catch (err) {
            alert('Lỗi khi cập nhật số liệu hệ thống!');
        }
    }

    // Gán sự kiện cho nút cập nhật số liệu hệ thống
    document.querySelector('.btn-update')?.addEventListener('click', updateSystemStats);

});