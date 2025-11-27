document.addEventListener('DOMContentLoaded', async function () {
  const tableBody = document.querySelector('#reportTable tbody');
  const paginationInfo = document.querySelector('.pagination-info');
  const paginationNav = document.querySelector('.pagination');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');

  // --- Modal Elements ---
  const viewModalEl = document.getElementById('reportViewModal');
  const viewModal = viewModalEl ? new bootstrap.Modal(viewModalEl) : null;
  const viewIdEl = document.getElementById('viewId');
  const viewNameEl = document.getElementById('viewName');
  const viewTypeEl = document.getElementById('viewType');
  const viewUpdatedAtEl = document.getElementById('viewUpdatedAt');
  const viewDescEl = document.getElementById('viewDesc');
  const viewUpdatedByEl = document.getElementById('viewUpdatedBy');
  const viewDetailsEl = document.getElementById('viewDetails');

  // Biến lưu trữ dữ liệu và trạng thái phân trang
  let allStats = []; // Dữ liệu gốc, không thay đổi
  let filteredStats = []; // Dữ liệu đã được lọc, dùng để hiển thị
  const itemsPerPage = 4;
  let currentPage = 1;

  // --- Helper Functions ---
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toTimeString().slice(0, 8);
    return `${time} ${day}/${month}/${year}`;
  }

  function getBadgeClass(type) {
    const typeStr = String(type || '').toLowerCase();
    if (typeStr.includes('thống kê')) return 'stats';
    if (typeStr.includes('so sánh')) return 'compare';
    return 'other';
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Rendering Functions ---
  function renderStatRow(stat) {
    const tr = document.createElement('tr');
    tr.dataset.id = stat.id; // Use data-id for easier access
    tr.dataset.type = stat.type || 'Khác';

    const badgeClass = getBadgeClass(stat.type);
    const displayType = stat.type || 'Khác';

    tr.innerHTML = `
      <td class="ps-4">
        <strong class="btn-view-report" data-id="${stat.id}" style="cursor:pointer;">
          ${escapeHtml(stat.id)}
        </strong>
      </td>
      <td>
        <span class="btn-view-report" data-id="${stat.id}" style="cursor:pointer;">
          ${escapeHtml(stat.name)}
        </span>
      </td>
      <td>${formatDate(stat.updatedAt)}</td>
      <td><span class="badge ${badgeClass}">${displayType}</span></td>
      <td class="text-center">${escapeHtml(stat.description) || 'N/A'}</td>
    `;
    return tr;
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
    paginationNav.innerHTML = '';
    if (totalPages <= 1) return;

    let paginationHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}" tabindex="-1"><i class="fas fa-chevron-left"></i></a>
      </li>`;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    paginationHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></a>
      </li>`;

    paginationNav.innerHTML = paginationHTML;
  }

  function renderCurrentPage() {
    tableBody.innerHTML = '';
    if (filteredStats.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không tìm thấy báo cáo nào</td></tr>';
      paginationInfo.innerHTML = 'Hiển thị <strong>0</strong> kết quả';
      paginationNav.innerHTML = '';
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredStats.length);
    const pageStats = filteredStats.slice(startIndex, endIndex);

    pageStats.forEach((stat) => {
      tableBody.appendChild(renderStatRow(stat));
    });

    paginationInfo.innerHTML = `Hiển thị <strong>${startIndex + 1}</strong> đến <strong>${endIndex}</strong> của <strong>${filteredStats.length}</strong> kết quả`;
    renderPagination();
  }

  function renderReportDetails(report) {
    if (!viewDetailsEl) return;
    viewDetailsEl.innerHTML = '';

    const addLine = (label, value) => {
      const div = document.createElement('div');
      div.className = 'mb-2';
      div.innerHTML = `<strong>${label}:</strong> ${escapeHtml(String(value ?? ''))}`;
      viewDetailsEl.appendChild(div);
    };

    let showedAny = false;

    // Special handling for Comparison reports
    if (report.type === 'So sánh' && Array.isArray(report.content)) {
      const keyTranslations = {
        total: 'Tổng số',
        totalRegistered: 'Tổng số đăng ký',
        totalFeedback: 'Tổng số phản hồi',
        totalCourses: 'Tổng số khóa học',
        totalEvals: 'Tổng số đánh giá',
        totalStudentsCur: 'Tổng số sinh viên hiện tại',
        totalSessionsCur: 'Tổng số buổi học hiện tại',
        types: 'Số loại',
        subjects: 'Số bộ môn',
      };
      
      const rowFieldTranslations = {
        id: 'ID',
        rating: 'Đánh giá',
        courseId: 'Mã khóa học',
        content: 'Nội dung',
        tutorId: 'Mã gia sư',
        studentId: 'Mã sinh viên',
        comment: 'Bình luận',
      };

      report.content.forEach(item => {
        const title = Object.keys(item)[0];
        const details = item[title];

        if (title && details) {
          const titleEl = document.createElement('h6');
          titleEl.className = 'mt-3 fw-bold';
          titleEl.textContent = title;
          viewDetailsEl.appendChild(titleEl);

          // If the detail object is another report, just show the title.
          // Otherwise, render its key-value content.
          if (details.type !== 'Thống kê') {
            Object.keys(details).forEach(key => {
              if (key === 'rows' && Array.isArray(details[key])) {
                // Handle the nested 'rows' array
                const rows = details[key];
                rows.forEach((row, index) => {
                  const rowEl = document.createElement('div');
                  rowEl.className = 'mb-2 ms-2 p-2 border-bottom';
                  
                  const rowTitle = document.createElement('strong');
                  rowTitle.textContent = `Mục #${index + 1}`;
                  rowEl.appendChild(rowTitle);

                  Object.keys(row).forEach(rowKey => {
                    const p = document.createElement('p');
                    p.className = 'mb-0 ms-2';
                    const label = rowFieldTranslations[rowKey] || rowKey;
                    p.innerHTML = `<strong>${label}:</strong> ${escapeHtml(row[rowKey])}`;
                    rowEl.appendChild(p);
                  });
                  viewDetailsEl.appendChild(rowEl);
                });
              } else {
                // Handle simple key-value pairs
                const label = keyTranslations[key] || key;
                addLine(label, details[key]);
              }
            });
          }
        }
      });
      showedAny = true;
    }

    const fieldLabels = {
      numCourses: 'Số khóa học',
      numStudents: 'Số sinh viên',
      numSessions: 'Số buổi học',
      numTutors: 'Số gia sư',
      averageSessionsPerCourse: 'TB buổi/khóa',
      averageStudentsPerCourse: 'TB sinh viên/khóa',
      averageTutorsPerCourse: 'TB gia sư/khóa',
      content: 'Nội dung',
    };
    const known = Object.keys(fieldLabels);

    known.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(report, k) && report[k] !== undefined) {
        if (k === 'content' && typeof report[k] !== 'string') {
          return;
        }
        
        if (k === 'content' && typeof report[k] === 'string') {
          const p = document.createElement('div');
          p.className = 'mb-2';
          p.textContent = report[k];
          p.style.whiteSpace = 'pre-wrap';
          viewDetailsEl.appendChild(p);
        } else {
          addLine(fieldLabels[k] || k, report[k]);
        }
        showedAny = true;
      }
    });

    if (report.courses && Array.isArray(report.courses.details)) {
      const hdr = document.createElement('div');
      hdr.className = 'mb-2';
      hdr.innerHTML = '<strong>Courses:</strong>';
      viewDetailsEl.appendChild(hdr);
      report.courses.details.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'mb-2 ms-2';
        const title = escapeHtml(d.nameCourse || d.name || `Khóa ${i + 1}`);
        const parts = [];
        if (d.numSessions !== undefined) parts.push(`Buổi: ${escapeHtml(String(d.numSessions))}`);
        if (d.numTutors !== undefined) parts.push(`Gia sư: ${escapeHtml(String(d.numTutors))}`);
        if (d.numStudents !== undefined) parts.push(`Sinh viên: ${escapeHtml(String(d.numStudents))}`);
        item.innerHTML = `<div><strong>${title}</strong></div><div class="small text-muted">${parts.join(' — ')}</div>`;
        viewDetailsEl.appendChild(item);
      });
      showedAny = true;
    }

    const skip = new Set(['id', 'name', 'type', 'description', 'updatedAt', 'updatedBy', 'courses', 'content', ...known]);
    Object.keys(report).forEach((k) => {
      if (!skip.has(k)) {
        const v = report[k];
        if (typeof v === 'object' && v !== null) {
          const pre = document.createElement('pre');
          pre.className = 'small bg-white p-2';
          pre.textContent = JSON.stringify(v, null, 2);
          viewDetailsEl.appendChild(pre);
        } else {
          addLine(k, v);
        }
        showedAny = true;
      }
    });

    if (!showedAny) {
      viewDetailsEl.innerHTML = '<div class="text-muted">(Không có dữ liệu chi tiết)</div>';
    }
  }

  // --- Data and Filtering ---
  function filterAndRender() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filteredStats = !searchTerm
      ? [...allStats]
      : allStats.filter((stat) =>
      (stat.name?.toLowerCase().includes(searchTerm) ||
        stat.id?.toLowerCase().includes(searchTerm))
      );
    currentPage = 1;
    renderCurrentPage();
  }

  async function loadSystemStats() {
    try {
      const [statsResponse, cmpResponse] = await Promise.all([
        fetch('/api/data/stats-reports.json'),
        fetch('/api/data/cmp-reports.json'),
      ]);
      if (!statsResponse.ok || !cmpResponse.ok) throw new Error('Không tải được dữ liệu báo cáo');

      const statsArr = await statsResponse.json();
      const cmpArr = await cmpResponse.json();
      const combinedArr = [];
      if (Array.isArray(statsArr)) combinedArr.push(...statsArr);
      if (Array.isArray(cmpArr)) combinedArr.push(...cmpArr);

      allStats = combinedArr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      filteredStats = [...allStats];
      currentPage = 1;
      renderCurrentPage();
    } catch (error) {
      console.error('Lỗi:', error);
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải số liệu hệ thống!</td></tr>`;
      paginationNav.innerHTML = '';
    }
  }

  // --- Event Listeners ---
  searchInput.addEventListener('input', filterAndRender);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterAndRender();
  });

  paginationNav.addEventListener('click', function (e) {
    e.preventDefault();
    const link = e.target.closest('.page-link');
    if (!link || link.parentElement.classList.contains('disabled') || link.parentElement.classList.contains('active')) return;

    const page = parseInt(link.dataset.page);
    const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      renderCurrentPage();
    }
  });

  tableBody.addEventListener('click', function (e) {
    const viewButton = e.target.closest('.btn-view-report');
    if (!viewButton) return;

    const reportId = viewButton.dataset.id;
    const report = filteredStats.find((r) => r.id === reportId);

    if (report && viewModal) {
      viewIdEl.textContent = report.id || '';
      viewNameEl.textContent = report.name || '';
      viewTypeEl.textContent = report.type || '';
      viewTypeEl.className = `badge ${getBadgeClass(report.type)}`;
      viewUpdatedAtEl.textContent = report.updatedAt ? formatDate(report.updatedAt) : '';
      viewUpdatedByEl.textContent = report.updatedBy || '';
      viewDescEl.textContent = report.description || '';
      viewDescEl.style.whiteSpace = 'pre-wrap';

      renderReportDetails(report);
      viewModal.show();
    }
  });

  // Initial Load
  loadSystemStats();
});
