let currentChart = null; // Lưu biểu đồ hiện tại

document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('mainChart');
  const ctx = canvas.getContext('2d');

  // === DỮ LIỆU BIỂU ĐỒ ===
  const chartConfigs = {
    chart1: {
      type: 'bar',
      data: {
        labels: ['SV', 'GV', 'Lớp', 'Môn', 'Tutor', 'Khoa'],
        datasets: [
          { label: '2024', data: [65, 78, 45, 82, 55, 70], backgroundColor: '#6f42c1' },
          { label: '2025', data: [70, 85, 50, 88, 60, 75], backgroundColor: '#3a89bf' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
    },
    chart2: {
      type: 'doughnut',
      data: {
        labels: ['Tốt', 'Khá', 'TB', 'Yếu'],
        datasets: [{
          data: [60, 25, 10, 5],
          backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    }
  };

  // === HÀM TẠO BIỂU ĐỒ ===
  function renderChart(type) {
    // Hủy biểu đồ cũ
    if (currentChart) {
      currentChart.destroy();
    }

    // Tạo mới
    currentChart = new Chart(ctx, chartConfigs[type]);
  }

  // === MẶC ĐỊNH: BIỂU ĐỒ 1 ===
  renderChart('chart1');

  // === CHUYỂN TAB ===
  document.querySelectorAll('[data-chart]').forEach(btn => {
    btn.addEventListener('click', function () {
      const type = this.getAttribute('data-chart');

      // Active button
      document.querySelectorAll('[data-chart]').forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-outline-secondary');
      });
      this.classList.remove('btn-outline-secondary');
      this.classList.add('btn-primary', 'active');

      // Render biểu đồ
      renderChart(type);
    });
  });
});

 function clearField(fieldId) {
        document.getElementById(fieldId).value = '';
}

        function selectField(fieldId) {
            const field = document.getElementById(fieldId);
            const value = field.value;
            if (value) {
                alert(`Đã chọn ${fieldId}: ${value}`);
            } else {
                alert('Vui lòng nhập/chọn giá trị!');
            }
        }

        function deleteField(fieldId) {
            if (confirm('Bạn có chắc muốn xóa?')) {
                document.getElementById(fieldId).value = '';
            }
        }