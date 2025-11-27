// scripts/admin/report-analyze.js
document.addEventListener('DOMContentLoaded', function () {
  const tableBody = document.querySelector('#reportTable tbody');
  const modal = new bootstrap.Modal(document.getElementById('reportModal'));
  const modalTitle = document.getElementById('modalTitle');
  const reportForm = document.getElementById('reportForm');

  // Các input
  const reportName = document.getElementById('reportName');
  const reportType = document.getElementById('reportType');
  const reportDesc = document.getElementById('reportDesc');
  const downloadToggle = document.getElementById('downloadToggle');
  const reportContent = document.getElementById('reportContent');

  // Các phần tử cho modal xem (chỉ đọc - hiển thị chi tiết)
  const viewModalEl = document.getElementById('reportViewModal');
  const viewModal = viewModalEl ? new bootstrap.Modal(viewModalEl) : null;
  const viewIdEl = document.getElementById('viewId');
  const viewNameEl = document.getElementById('viewName');
  const viewTypeEl = document.getElementById('viewType');
  const viewUpdatedAtEl = document.getElementById('viewUpdatedAt');
  const viewDescEl = document.getElementById('viewDesc');

  // viewContentEl không còn sử dụng; chi tiết giờ được hiển thị trong viewDetailsEl
  const viewUpdatedByEl = document.getElementById('viewUpdatedBy');
  const viewDetailsEl = document.getElementById('viewDetails');

  function renderReportDetails(report) {
    if (!viewDetailsEl) return;
    viewDetailsEl.innerHTML = '';

    // Hàm trợ giúp: thêm một dòng có nhãn và giá trị
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

    // Các trường đơn giản (số/chuỗi) đã biết kèm nhãn tiếng Việt thân thiện
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
    // Hiển thị các trường đã biết nếu tồn tại trong báo cáo
    known.forEach((k) => {
      if (k in report && report[k] !== undefined) {
        // Skip content field if it's not a string (already handled for 'So sánh' type)
        if (k === 'content' && typeof report[k] !== 'string') {
          return;
        }
        // xử lý đặc biệt cho field content nếu đây là chuỗi
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

    // Cấu trúc đặc biệt: courses.details (mảng các đối tượng)
    if (report.courses && Array.isArray(report.courses.details)) {
      const hdr = document.createElement('div');
      hdr.className = 'mb-2';
      hdr.innerHTML = '<strong>Courses:</strong>';
      viewDetailsEl.appendChild(hdr);

      // Hiển thị từng khóa học dạng các dòng văn bản (không dùng bảng)
      report.courses.details.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'mb-2 ms-2';
        const title = escapeHtml(d.nameCourse || d.name || `Khóa ${i + 1}`);
        const parts = [];
        if (d.numSessions !== undefined)
          parts.push(`Buổi: ${escapeHtml(String(d.numSessions))}`);
        if (d.numTutors !== undefined)
          parts.push(`Gia sư: ${escapeHtml(String(d.numTutors))}`);
        if (d.numStudents !== undefined)
          parts.push(`Sinh viên: ${escapeHtml(String(d.numStudents))}`);
        item.innerHTML = `<div><strong>${title}</strong></div><div class="small text-muted">${parts.join(' — ')}</div>`;
        viewDetailsEl.appendChild(item);
      });

      showedAny = true;
    }

    // Cấu trúc đặc biệt khác: các trường feedback/evaluations/document chứa mảng 'details'
    const multiDetailFields = {
      'stu-feedbacks': 'Phản hồi sinh viên',
      'tutor-evaluations': 'Đánh giá gia sư',
      feedbacks: 'Phản hồi',
      evaluations: 'Đánh giá',
      evaluation: 'Đánh giá',
      document: 'Tài liệu',
      documents: 'Tài liệu',
    };

    Object.keys(multiDetailFields).forEach((field) => {
      const label = multiDetailFields[field];
      const value = report[field];
      if (value && Array.isArray(value.details)) {
        const hdr = document.createElement('div');
        hdr.className = 'mb-2';
        hdr.innerHTML = `<strong>${escapeHtml(label)}:</strong>`;
        viewDetailsEl.appendChild(hdr);

        value.details.forEach((d, idx) => {
          const item = document.createElement('div');
          item.className = 'mb-2 ms-2';

          // Tạo tiêu đề ngắn cho item từ các trường thông dụng
          const titleParts = [];
          if (d.id) titleParts.push(String(d.id));
          if (d.name) titleParts.push(String(d.name));
          if (d.student) titleParts.push(String(d.student));
          if (d.tutor) titleParts.push(String(d.tutor));
          const title = titleParts.length
            ? escapeHtml(titleParts.join(' - '))
            : `${escapeHtml(label)} ${idx + 1}`;

          // Tạo nội dung tóm tắt từ các khóa thường gặp (comment, note, score, ...)
          const bodyParts = [];
          if (d.comment) bodyParts.push(escapeHtml(d.comment));
          if (d.note) bodyParts.push(escapeHtml(d.note));
          if (d.score !== undefined)
            bodyParts.push(`Score: ${escapeHtml(String(d.score))}`);
          if (d.answer) bodyParts.push(escapeHtml(d.answer));
          if (d.content) bodyParts.push(escapeHtml(d.content));

          item.innerHTML = `<div><strong>${title}</strong></div><div class="small text-muted">${bodyParts.join(' — ')}</div>`;
          viewDetailsEl.appendChild(item);
        });
        showedAny = true;
      }
    });

    // Đối với các trường khác chưa xử lý ở trên, hiển thị từng dòng đơn giản
    const skip = new Set([
      'id',
      'name',
      'type',
      'description',
      'updatedAt',
      'updatedBy',
      'updatedBy',
      'courses',
      'content',
      ...known,
    ]);
    Object.keys(report).forEach((k) => {
      if (!skip.has(k)) {
        const v = report[k];
        // nếu là object hoặc array thì chuyển thành chuỗi JSON ngắn để hiển thị
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

    if (!showedAny)
      viewDetailsEl.innerHTML =
        '<div class="text-muted">(Không có dữ liệu chi tiết)</div>';
  }

  // Nút
  const btnConfirm = document.getElementById('btnConfirm');

  // Bộ lọc
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterID = document.getElementById('filterID');

  let dataStatsArr = [];
  let dataCmpArr = [];
  let dataFilterArr = [];
  let currentEditID = null;
  // Pagination state
  const ITEMS_PER_PAGE = 4; // show 4 items per page
  let currentPage = 1;

  // ==================================================================
  // 1. Load dữ liệu từ JSON
  // ==================================================================
  async function loadData() {
    try {
      const [respStats, respCmp] = await Promise.all([
        fetch('/api/data/stats-reports.json'),
        fetch('/api/data/cmp-reports.json'),
      ]);

      // Kiểm tra lỗi tất cả fetch
      if (!respStats.ok || !respCmp.ok) {
        throw new Error(`Lỗi tải dữ liệu: 
        thống kê(${respStats.status}), 
        so sánh(${respCmp.status})`);
      }

      // Parse JSON song song
      const [stats, cmp] = await Promise.all([
        respStats.json(),
        respCmp.json(),
      ]);

      dataStatsArr = stats;
      dataCmpArr = cmp;
      dataFilterArr = [...stats, ...cmp]; // Tối ưu concat

      renderTable();
      updateIDFilter();
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);

      if (tableBody)
        tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">
            Không thể tải dữ liệu! Vui lòng kiểm tra server.
          </td>
        </tr>`;
    }
  }

  // ==================================================================
  // 2. Render bảng
  // ==================================================================
  function renderTable() {
    const filtered = filterReports();
    const length = filtered.length;
    const totalPages = Math.max(1, Math.ceil(length / ITEMS_PER_PAGE));
    // ensure currentPage within range
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Nếu trống
    if (length === 0) {
      tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-muted">Chưa có báo cáo nào</td>
      </tr>`;
      updatePagination(0);
      return;
    }

    // Dùng string build để giảm thao tác DOM
    let html = '';

    // slice only the current page items
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    for (const ele of pageItems) {
      // Map badge classes: 'Thống kê' => stats, 'So sánh' => compare
      // Also treat 'Tài chính' as 'compare' (requested)
      const badgeClass =
        ele.type === 'Thống kê'
          ? 'stats'
          : ele.type === 'Tài chính'
            ? 'compare'
            : 'compare';

      html += `
      <tr data-id="${ele.id}" data-type="${ele.type}">
        <td class="ps-4">
          <strong class="btn-view-report" data-id="${ele.id}" style="cursor:pointer;">
            ${ele.id}
          </strong>
        </td>
        <td>
          <span class="btn-view-report" data-id="${ele.id}" style="cursor:pointer;">
            ${escapeHtml(ele.name)}
          </span>
        </td>
        <td>${formatDate(ele.updatedAt)}</td>
        <td>
          <span class="badge ${badgeClass}">${ele.type}</span>
        </td>
        <td class="text-center">
          <button class="btn-action btn-edit me-2" title="Sửa">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" title="Xóa">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }

    tableBody.innerHTML = html;
    updatePagination(length, startIndex, pageItems.length);
    renderPaginationControls(length, currentPage, totalPages);
  }

  // ==================================================================
  // 3. Các hàm hỗ trợ
  // ==================================================================
  function filterReports() {
    const search = searchInput.value.toLowerCase().trim();
    const type = filterType.value;
    const id = filterID.value;

    return dataFilterArr.filter((r) => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        (r.description && r.description.toLowerCase().includes(search));
      const matchesType = !type || r.type === type;
      // So sánh tiền tố ID không phân biệt hoa thường để 'STAT_' khớp với 'stat_'
      const matchesID =
        !id ||
        String(r.id || '')
          .toLowerCase()
          .startsWith(String(id || '').toLowerCase());
      return matchesSearch && matchesType && matchesID;
    });
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toTimeString().slice(0, 8);
    return `${time} ${day}/${month}/${year}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updatePagination(totalItems, startIndex = 0, shownCount = 0) {
    const info = document.querySelector('.pagination-info');
    if (!info) return;
    if (!totalItems || totalItems === 0) {
      info.innerHTML = `Hiển thị <strong>0</strong> đến <strong>0</strong> của <strong>0</strong> kết quả`;
      return;
    }
    const from = startIndex + 1;
    const to = Math.min(startIndex + shownCount, totalItems);
    info.innerHTML = `Hiển thị <strong>${from}</strong> đến <strong>${to}</strong> của <strong>${totalItems}</strong> kết quả`;
  }

  function renderPaginationControls(totalItems, page, totalPages) {
    const ul = document.getElementById('paginationList');
    if (!ul) return;
    // Build prev, page numbers and next
    let html = '';
    const prevDisabled = page <= 1 ? ' disabled' : '';
    const nextDisabled = page >= totalPages ? ' disabled' : '';

    html += `<li class="page-item${prevDisabled}"><a class="page-link" href="#" data-action="prev"><i class="fas fa-chevron-left"></i></a></li>`;

    for (let i = 1; i <= totalPages; i++) {
      const active = i === page ? ' active' : '';
      html += `<li class="page-item${active}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    html += `<li class="page-item${nextDisabled}"><a class="page-link" href="#" data-action="next"><i class="fas fa-chevron-right"></i></a></li>`;

    ul.innerHTML = html;
  }

  // Filter mã động
  function updateIDFilter() {
    // Phát hiện tiền tố ID như stat_, stats-, stat-, STAT_, cmp_, CMP_
    const detected = new Set();
    dataFilterArr.forEach((r) => {
      const id = String(r.id || '');
      // lấy phần chữ cái đứng trước '_' hoặc '-' làm tiền tố
      const m = id.match(/^([A-Za-z]+?)[_-].*/);
      if (!m) {
        // phương án dự phòng: nếu id bắt đầu bằng 'stat' hoặc 'cmp' nhưng không có ký tự phân cách
        const low = id.toLowerCase();
        if (low.startsWith('stat')) {
          detected.add('STAT');
          return;
        }
        if (low.startsWith('cmp')) {
          detected.add('CMP');
          return;
        }
        return;
      }
      const p = m[1].toLowerCase();
      if (p.startsWith('stat')) detected.add('STAT');
      else if (p.startsWith('cmp')) detected.add('CMP');
      else detected.add(p.toUpperCase());
    });
    const prefixes = [...detected].sort();
    console.debug('updateIDFilter: detected prefixes ->', prefixes);

    // bắt đầu với option mặc định
    if (!filterID) return;
    filterID.innerHTML = `<option value="">Mã</option>`;

    // thêm các tiền tố đã phát hiện (chuẩn hoá thành 'STAT' hoặc 'CMP')
    prefixes.forEach((prefix) => {
      let displayText = '';
      if (prefix === 'STAT') displayText = 'STAT';
      else if (prefix === 'CMP') displayText = 'CMP';
      else displayText = `${prefix.replace(/_$/, '')}`;

      const opt = new Option(displayText || prefix, prefix);
      filterID.appendChild(opt);
    });
  }

  // ==================================================================
  // 5. Mở modal: Thêm mới
  // ==================================================================
  document.querySelector('.btn-search').addEventListener('click', () => {
    currentEditID = null;
    modalTitle.textContent = 'Tạo báo cáo mới';
    btnConfirm.style.display = 'none';

    reportForm.reset();
    reportContent.value = '';
    modal.show();
  });

  // pagination interactions (delegated)
  document
    .getElementById('paginationList')
    ?.addEventListener('click', function (ev) {
      ev.preventDefault();
      const a = ev.target.closest('a');
      if (!a) return;
      const action = a.dataset.action;
      if (action === 'prev') {
        if (currentPage > 1) currentPage -= 1;
        renderTable();
        return;
      }
      if (action === 'next') {
        const totalPages = Math.max(
          1,
          Math.ceil(filterReports().length / ITEMS_PER_PAGE)
        );
        if (currentPage < totalPages) currentPage += 1;
        renderTable();
        return;
      }
      const page = Number(a.dataset.page || 0);
      if (page > 0) {
        currentPage = page;
        renderTable();
      }
    });

  // ==================================================================
  // 6. Sửa & Xóa (dùng event delegation)
  // ==================================================================
  tableBody.addEventListener('click', async function (e) {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;

    // Xem chi tiết khi click vào ID hoặc tên báo cáo
    if (e.target.closest('.btn-view-report')) {
      const rid = e.target.closest('.btn-view-report').dataset.id;
      const report = dataFilterArr.find((r) => r.id === rid);
      if (report && viewModal) {
        viewIdEl.textContent = report.id || '';
        viewNameEl.textContent = report.name || '';
        viewTypeEl.textContent = report.type || '';
        // treat 'Tài chính' as 'compare' so its badge uses compare styling
        viewTypeEl.className =
          'badge ' +
          (report.type === 'Thống kê'
            ? 'stats'
            : report.type === 'So sánh'
              ? 'compare'
              : 'compare');
        viewUpdatedAtEl.textContent = report.updatedAt
          ? formatDate(report.updatedAt)
          : '';
        viewUpdatedByEl.textContent = report.updatedBy || '';
        viewDescEl.textContent = report.description || '';
        viewDescEl.style.whiteSpace = 'pre-wrap';
        // Hiển thị chi tiết dạng thân thiện (không phải raw JSON)
        renderReportDetails(report);
        viewModal.show();
        return; // handled
      }
    }

    // Sửa
    if (e.target.closest('.btn-edit')) {
      const report = dataFilterArr.find((r) => r.id === id);
      if (!report) return;

      currentEditID = id;
      modalTitle.textContent = 'Chỉnh sửa báo cáo';
      btnConfirm.style.display = 'inline-flex';

      reportName.value = report.name;
      reportType.value = report.type;
      reportDesc.value = report.description || '';
      // downloadToggle.checked = report.downloadable || false; // Kiểm tra element có tồn tại
      if (downloadToggle) downloadToggle.checked = report.downloadable || false;
      reportContent.value = report.content || '';

      modal.show();
    }

    // Xóa
    if (e.target.closest('.btn-delete')) {
      if (confirm(`Xóa báo cáo "${id}"? Không thể khôi phục!`)) {
        dataStatsArr = dataStatsArr.filter((r) => r.id !== id);
        dataCmpArr = dataCmpArr.filter((r) => r.id !== id);
        dataFilterArr = [...dataStatsArr, ...dataCmpArr];
        try {
          // Gọi song song cả 2 request
          const [resp1, resp2] = await Promise.all([
            fetch('/api/data/stats-reports.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataStatsArr),
            }),
            fetch('/api/data/cmp-reports.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataCmpArr),
            }),
          ]);

          if (resp1.ok && resp2.ok) {
            alert('Xóa báo cáo thành công.');
          } else {
            alert('Lỗi khi xóa!');
          }
        } catch (err) {
          console.error('Request failed:', err);
          alert('Lỗi kết nối tới server. Không lưu được file.');
          return;
        }

        renderTable();
        updateIDFilter();
      }
    }
  });

  // ==================================================================
  // 7. Lưu báo cáo (Thêm hoặc Sửa)
  // ==================================================================
  async function saveReport() {
    const name = reportName.value.trim();
    const type = reportType.value;
    const desc = reportDesc.value.trim();
    const content = reportContent.value.trim();

    if (!name || !type) {
      alert('Vui lòng nhập tên và chọn loại báo cáo!');
      return;
    }

    if (currentEditID === null) {
      // Thêm mới
      const newID =
        (type === 'Thống kê' ? 'STATS_' : 'CMP_') +
        String(Date.now() + Math.floor(Math.random() * 1000));

      const newReport = {
        id: newID,
        type: type,
        name: name,
        description: desc,
        updatedAt: new Date().toISOString(),
        updatedBy: 'COO001',
        content: content,
      };

      if (type === 'Thống kê') {
        dataStatsArr.push(newReport);
        dataFilterArr.push(newReport);
      } else if (type === 'So sánh') {
        dataCmpArr.push(newReport);
        dataFilterArr.push(newReport);
      } else {
        alert('Loại báo cáo không hợp lệ!');
        return;
      }
    } else {
      // Sửa
      const reportEdit =
        dataStatsArr.find((r) => r.id === currentEditID) ||
        dataCmpArr.find((r) => r.id === currentEditID);
      if (!reportEdit) {
        alert('Báo cáo không tồn tại!');
        return;
      }
      reportEdit.name = name;
      reportEdit.type = type;
      reportEdit.description = desc;
      reportEdit.updatedAt = new Date().toISOString();
      reportEdit.updatedBy = 'COO001';
      reportEdit.content = content;
    }

    if (type === 'Thống kê') {
      try {
        await fetch('/api/data/stats-reports.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataStatsArr),
        });
      } catch (err) {
        console.error('Request failed:', err);
        alert('Lỗi kết nối tới server. Không lưu được file.');
        return;
      }
    } else if (type === 'So sánh') {
      try {
        await fetch('/api/data/cmp-reports.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataCmpArr),
        });
      } catch (err) {
        console.error('Request failed:', err);
        alert('Lỗi kết nối tới server. Không lưu được file.');
        return;
      }
    } else {
      alert('Loại báo cáo không hợp lệ!');
      return;
    }

    renderTable();
    updateIDFilter();
    modal.hide();
  }

  // Event listeners cho nút lưu
  btnConfirm.addEventListener('click', saveReport);

  // ==================================================================
  // 8. Tìm kiếm & lọc realtime
  // ==================================================================
  // reset to first page whenever filters or search change
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });
  filterType.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
  });
  filterID.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
  });
  // Xóa tìm kiếm
  document.getElementById('clearSearch')?.addEventListener('click', () => {
    searchInput.value = '';
    renderTable();
  });

  // ==================================================================
  // 9. Khởi chạy
  // ==================================================================
  loadData();
});
