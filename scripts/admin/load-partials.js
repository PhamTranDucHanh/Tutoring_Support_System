document.addEventListener("DOMContentLoaded", function () {
  // Danh sách các partial cần load
  const partials = [
    { id: "app-header-placeholder", file: "../partials/admin-header.html" },
    { id: "app-footer-placeholder", file: "../partials/app-footer.html" },
    // Thêm các partial khác ở đây nếu cần
  ];

  // Load từng partial
  partials.forEach(partial => {
    const element = document.getElementById(partial.id);
    if (!element) {
      console.warn(`Không tìm thấy phần tử #${partial.id}`);
      return;
    }

    fetch(partial.file)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(html => {
        element.innerHTML = html;
      })
      .catch(err => {
        console.error(`Lỗi load ${partial.file}:`, err);
        element.innerHTML = `<p class="text-danger p-3">Không tải được nội dung!</p>`;
      });
  });
});