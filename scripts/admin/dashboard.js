document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.querySelector('#reportTable tbody');
    const paginationInfo = document.querySelector('.pagination-info');

    // Nơi hiển thị thông tin admin (ví dụ: chào mừng, avatar, tên...)
    const adminNameEl = document.getElementById('username');     // bạn thêm thẻ này trong HTML nếu cần
    const adminEmailEl = document.getElementById('email');

    // Hàm định dạng ngày giờ
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const time = date.toTimeString().slice(0, 8);
        return `${time} ${day}/${month}/${year}`;
    }

    // Render 1 dòng báo cáo
    function renderReportRow(report) {
        const tr = document.createElement('tr');
        tr.dataset.code = report.code;
        tr.dataset.type = report.type;

        const badgeMap = {
            'Thống kê': 'stats',
            'Tài chính': 'finance',
            'So sánh': 'compare'
        };
        const badgeClass = badgeMap[report.type] || 'secondary';

        tr.innerHTML = `
            <td class="ps-4"><strong>${report.code}</strong></td>
            <td>${report.name}</td>
            <td>${formatDate(report.updated)}</td>
            <td><span class="badge ${badgeClass}">${report.type}</span></td>
            <td class="text-center">${report.description}</td>
        `;
        return tr;
    }

    // TẢI TOÀN BỘ DỮ LIỆU
    async function loadAdminData() {
        try {
            const response = await fetch('/data/admin.json'); // sửa đường dẫn nếu cần
            if (!response.ok) throw new Error('Không tải được dữ liệu');

            const data = await response.json(); // data là object { user: {...}, reports: [...] }

            // 1. XỬ LÝ THÔNG TIN ADMIN
            if (data.user) {
                // Ví dụ: hiện tên admin ở header hoặc sidebar
                if (adminNameEl) adminNameEl.textContent = data.user.fullName;
                if (adminEmailEl) adminEmailEl.textContent = data.user.email;

                // Có thể lưu vào localStorage để dùng ở trang khác
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }

            // 2. XỬ LÝ DANH SÁCH BÁO CÁO
            const reports = data.reports || [];

            tableBody.innerHTML = '';
            if (reports.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có báo cáo</td></tr>';
            } else {
                reports.forEach(report => {
                    tableBody.appendChild(renderReportRow(report));
                });

                // Cập nhật phân trang
                paginationInfo.innerHTML = `Hiển thị <strong>1</strong> đến <strong>${reports.length}</strong> của <strong>${reports.length}</strong> kết quả`;
            }

        } catch (error) {
            console.error('Lỗi:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu!</td></tr>`;
        }
    }

    // Chạy ngay khi load trang
    loadAdminData();

    // Nút Cập nhật
    document.querySelector('.btn-update')?.addEventListener('click', () => {
        document.querySelector('.btn-update').innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Đang tải...';
        loadAdminData().finally(() => {
            document.querySelector('.btn-update').innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật';
        });
    });
});