document.addEventListener('DOMContentLoaded', function () {
  const modal = new bootstrap.Modal(document.getElementById('reportModal'));
  const modalTitle = document.getElementById('modalTitle');
  const reportForm = document.getElementById('reportForm');
  const fileUpload = document.getElementById('fileUpload');
  const fileInput = document.getElementById('fileInput');

  // Mở modal tạo mới
  document.getElementById('btnCreate').addEventListener('click', () => {
    modalTitle.textContent = 'Tạo báo cáo mới';
    reportForm.reset();
    fileUpload.innerHTML = `
      <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
      <p class="mb-0 text-muted">Chọn và thả tệp...</p>
    `;
    modal.show();
  });

  // Mở modal sửa
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function () {
      const row = this.closest('tr');
      modalTitle.textContent = 'Chỉnh sửa báo cáo';

      document.getElementById('reportName').value = row.cells[1].textContent;
      document.getElementById('reportType').value = row.cells[3].textContent.trim();
      document.getElementById('reportDesc').value = 'Thống kê Sinh viên'; // giả lập
      modal.show();
    });
  });

  // Xóa báo cáo
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function () {
      if (confirm('Bạn có chắc muốn xóa báo cáo này?')) {
        this.closest('tr').remove();
        updatePaginationInfo();
      }
    });
  });

  // Upload file
  fileUpload.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', updateFileDisplay);

  // Drag & Drop
  ['dragover', 'dragenter'].forEach(evt => {
    fileUpload.addEventListener(evt, e => {
      e.preventDefault();
      fileUpload.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach(evt => {
    fileUpload.addEventListener(evt, e => {
      e.preventDefault();
      fileUpload.classList.remove('dragover');
    });
  });

  fileUpload.addEventListener('drop', e => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      updateFileDisplay();
    }
  });

  function updateFileDisplay() {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileUpload.innerHTML = `
        <i class="fas fa-file-check fa-2x text-success mb-2"></i>
        <p class="mb-0"><strong>${file.name}</strong></p>
        <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
      `;
    }
  }

  // Xóa input
  document.getElementById('clearName').addEventListener('click', () => document.getElementById('reportName').value = '');
  document.getElementById('clearDesc').addEventListener('click', () => document.getElementById('reportDesc').value = '');

  // Tìm kiếm & Lọc
  document.getElementById('searchBtn').addEventListener('click', filterTable);
  document.getElementById('filterType').addEventListener('change', filterTable);
  document.getElementById('filterCode').addEventListener('change', filterTable);
  document.getElementById('searchInput').addEventListener('input', filterTable);

  function filterTable() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const type = document.getElementById('filterType').value;
    const code = document.getElementById('filterCode').value;
    const rows = document.querySelectorAll('#reportTable tbody tr');

    let visible = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const matchesSearch = text.includes(search);
      const matchesType = !type || row.dataset.type === type;
      const matchesCode = !code || row.dataset.code === code;

      if (matchesSearch && matchesType && matchesCode) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    updatePaginationInfo(visible);
  }

  function updatePaginationInfo(visible = null) {
    const total = document.querySelectorAll('#reportTable tbody tr').length;
    const shown = visible || total;
    document.getElementById('paginationInfo').innerHTML = `
      Hiển thị <strong>1</strong> đến <strong>${Math.min(shown, 10)}</strong> của <strong>${total}</strong> kết quả
    `;
  }
});