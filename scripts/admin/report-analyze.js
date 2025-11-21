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
  const fileUpload = document.getElementById('fileUpload');
  const fileInput = document.getElementById('fileInput');

  // Nút
  const btnCreate = document.getElementById('btnCreate');
  const btnConfirm = document.getElementById('btnConfirm');

  // Bộ lọc
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterCode = document.getElementById('filterCode');

  let reports = [];           // Mảng dữ liệu chính
  let currentEditCode = null; // Mã báo cáo đang sửa (null = thêm mới)
  let currentFile = null;     // File đã chọn

  // ==================================================================
  // 1. Load dữ liệu từ localStorage hoặc JSON
  // ==================================================================
  async function loadData() {
    try {
      const saved = localStorage.getItem('adminReports');
      if (saved) {
        reports = JSON.parse(saved);
      } else {
        const res = await fetch('/data/admin.json');
        const data = await res.json();
        reports = data.reports || [];
        localStorage.setItem('adminReports', JSON.stringify(reports));
      }
      renderTable();
      updateCodeFilter();
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu!</td></tr>`;
    }
  }

  // ==================================================================
  // 2. Render bảng
  // ==================================================================
  function renderTable() {
    tableBody.innerHTML = '';
    if (reports.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">Chưa có báo cáo nào</td></tr>`;
      updatePagination(0);
      return;
    }

    const filtered = filterReports();
    filtered.forEach(report => {
      const tr = document.createElement('tr');
      tr.dataset.code = report.code;
      tr.dataset.type = report.type;

      const badgeClass = report.type === 'Thống kê' ? 'stats' : 'finance';

      tr.innerHTML = `
                <td class="ps-4"><strong>${report.code}</strong></td>
                <td>${escapeHtml(report.name)}</td>
                <td>${formatDate(report.updated)}</td>
                <td><span class="badge ${badgeClass}">${report.type}</span></td>
                <td class="text-center">
                    <button class="btn-action btn-edit me-2" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tableBody.appendChild(tr);
    });
    updatePagination(filtered.length);
  }

  function filterReports() {
    const search = searchInput.value.toLowerCase().trim();
    const type = filterType.value;
    const code = filterCode.value;

    return reports.filter(r => {
      const matchesSearch = !search ||
        r.name.toLowerCase().includes(search) ||
        r.code.toLowerCase().includes(search) ||
        (r.description && r.description.toLowerCase().includes(search));
      const matchesType = !type || r.type === type;
      const matchesCode = !code || r.code === code;
      return matchesSearch && matchesType && matchesCode;
    });
  }

  // ==================================================================
  // 3. Các hàm hỗ trợ
  // ==================================================================
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

  function updatePagination(shown) {
    const total = reports.length;
    const info = document.querySelector('.pagination-info');
    if (info) {
      info.innerHTML = `Hiển thị <strong>1</strong> đến <strong>${Math.min(shown, total)}</strong> của <strong>${total}</strong> kết quả`;
    }
  }

  function updateCodeFilter() {
    const codes = [...new Set(reports.map(r => r.code))].sort();
    filterCode.innerHTML = '<option value="">Mã</option>';
    codes.forEach(c => {
      const opt = new Option(c, c);
      filterCode.appendChild(opt);
    });
  }

  // ==================================================================
  // 4. Upload file (Drag & Drop + Click)
  // ==================================================================
  fileUpload.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      currentFile = fileInput.files[0];
      updateFileDisplay(currentFile);
    }
  });

  ['dragover', 'dragenter'].forEach(e => fileUpload.addEventListener(e, ev => {
    ev.preventDefault();
    fileUpload.classList.add('dragover');
  }));

  ['dragleave', 'dragend', 'drop'].forEach(e => fileUpload.addEventListener(e, ev => {
    ev.preventDefault();
    fileUpload.classList.remove('dragover');
  }));

  fileUpload.addEventListener('drop', e => {
    e.preventDefault();
    fileUpload.classList.remove('dragover');
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      currentFile = e.dataTransfer.files[0];
      updateFileDisplay(currentFile);
    }
  });

  function updateFileDisplay(file) {
    if (!file) {
      fileUpload.innerHTML = `
                <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                <p class="mb-0 text-muted">Chọn và thả tệp...</p>
            `;
      return;
    }
    fileUpload.innerHTML = `
            <i class="fas fa-file-check fa-2x text-success mb-2"></i>
            <p class="mb-0"><strong>${file.name}</strong></p>
            <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
        `;
  }

  // ==================================================================
  // 5. Mở modal: Thêm mới
  // ==================================================================
  document.querySelector('.btn-search').addEventListener('click', () => {
    currentEditCode = null;
    modalTitle.textContent = 'Tạo báo cáo mới';
    btnCreate.style.display = 'inline-flex';
    btnConfirm.style.display = 'none';

    reportForm.reset();
    currentFile = null;
    updateFileDisplay();
    modal.show();
  });

  // ==================================================================
  // 6. Sửa & Xóa (dùng event delegation)
  // ==================================================================
  tableBody.addEventListener('click', function (e) {
    const row = e.target.closest('tr');
    if (!row) return;
    const code = row.dataset.code;

    // Sửa
    if (e.target.closest('.btn-edit')) {
      const report = reports.find(r => r.code === code);
      if (!report) return;

      currentEditCode = code;
      modalTitle.textContent = 'Chỉnh sửa báo cáo';
      btnCreate.style.display = 'none';
      btnConfirm.style.display = 'inline-flex';

      reportName.value = report.name;
      reportType.value = report.type;
      reportDesc.value = report.description || '';
      downloadToggle.checked = report.downloadable || false;
      currentFile = null;
      updateFileDisplay(); // reset file

      modal.show();
    }

    // Xóa
    if (e.target.closest('.btn-delete')) {
      if (confirm(`Xóa báo cáo "${code}"? Không thể khôi phục!`)) {
        reports = reports.filter(r => r.code !== code);
        localStorage.setItem('adminReports', JSON.stringify(reports));
        renderTable();
        updateCodeFilter();
      }
    }
  });

  // ==================================================================
  // 7. Lưu báo cáo (Thêm hoặc Sửa)
  // ==================================================================
  function saveReport() {
    const name = reportName.value.trim();
    const type = reportType.value;
    const desc = reportDesc.value.trim();

    if (!name || !type) {
      alert('Vui lòng nhập tên và chọn loại báo cáo!');
      return;
    }

    if (currentEditCode === null) {
      // Thêm mới
      const newCode = 'RP' + Date.now().toString().slice(-6);
      const newReport = {
        code: newCode,
        name,
        updated: new Date().toISOString(),
        type,
        description: desc,
        downloadable: downloadToggle.checked,
        fileName: currentFile ? currentFile.name : null
      };
      reports.push(newReport);
    } else {
      // Sửa
      const idx = reports.findIndex(r => r.code === currentEditCode);
      if (idx !== -1) {
        reports[idx] = {
          ...reports[idx],
          name,
          type,
          description: desc,
          downloadable: downloadToggle.checked,
          fileName: currentFile ? currentFile.name : reports[idx].fileName,
          updated: new Date().toISOString()
        };
      }
    }

    localStorage.setItem('adminReports', JSON.stringify(reports));
    renderTable();
    updateCodeFilter();
    modal.hide();
  }

  btnCreate.addEventListener('click', saveReport);
  btnConfirm.addEventListener('click', saveReport);

  // ==================================================================
  // 8. Tìm kiếm & lọc realtime
  // ==================================================================
  searchInput.addEventListener('input', renderTable);
  filterType.addEventListener('change', renderTable);
  filterCode.addEventListener('change', renderTable);

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