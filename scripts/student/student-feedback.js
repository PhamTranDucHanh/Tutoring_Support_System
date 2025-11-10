// ===== student-feedback.js – PHIÊN BẢN HOÀN HẢO, KHÔNG CÒN BUG PLACEHOLDER =====
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.querySelector('.editor');
  const placeholderText = "Sinh viên đưa ra phản hồi tại đây";
  let isEmpty = true;

  // Khởi tạo: nếu trống thì hiện placeholder
  if (!editor.textContent.trim()) {
    editor.textContent = placeholderText;
    editor.classList.add('placeholder');
  }

  // Khi focus: xóa placeholder
  editor.addEventListener('focus', () => {
    if (editor.classList.contains('placeholder')) {
      editor.textContent = '';
      editor.classList.remove('placeholder');
      isEmpty = true;
    }
  });

  // Khi blur: nếu trống thì hiện lại placeholder
  editor.addEventListener('blur', () => {
    if (!editor.textContent.trim()) {
      editor.textContent = placeholderText;
      editor.classList.add('placeholder');
      isEmpty = true;
    } else {
      editor.classList.remove('placeholder');
      isEmpty = false;
    }
  });

  // Khi gõ phím: nếu đang có placeholder thì xóa nó
  editor.addEventListener('keydown', () => {
    if (editor.classList.contains('placeholder')) {
      editor.textContent = '';
      editor.classList.remove('placeholder');
      isEmpty = true;
    }
  });

  // === CHẤM SAO CHỈ SÁNG KHI CLICK ===
  const stars = document.querySelectorAll('.stars i');
  const ratingText = document.querySelector('.rating span');
  let currentRating = 0;

  function updateStars() {
    stars.forEach((star, i) => {
      star.classList.toggle('filled', i < currentRating);
    });
  }

  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      currentRating = i + 1;
      updateStars();
      ratingText.textContent = `${currentRating} / 5`;
    });
  });

  // === NÚT XÓA ===
  document.querySelector('.clear').addEventListener('click', () => {
    editor.textContent = placeholderText;
    editor.classList.add('placeholder');
    isEmpty = true;

    currentRating = 0;
    updateStars();
    ratingText.textContent = '0 / 5';
  });

  // === NÚT GỬI ===
  document.querySelector('.submit').addEventListener('click', () => {
    const text = editor.textContent.trim();
    if (isEmpty || text === placeholderText) {
      alert('Vui lòng nhập phản hồi trước khi gửi!');
      return;
    }
    alert(`Đã gửi thành công!\n\nNội dung: "${text}"\nĐánh giá: ${currentRating}/5`);
  });

  // === THANH CÔNG CỤ ĐỊNH DẠNG ===
  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-command');
      document.execCommand(cmd, false, null);
      editor.focus();
    });
  });
});

  // Xử lý link
document.querySelector('[data-command="createLink"]')?.addEventListener('click', () => {
  const url = prompt('Nhập link:');
  if (url) document.execCommand('createLink', false, url);
});

// Xử lý ảnh
document.querySelector('[data-command="insertImage"]')?.addEventListener('click', () => {
  const url = prompt('Nhập URL ảnh:');
  if (url) document.execCommand('insertImage', false, url);
});