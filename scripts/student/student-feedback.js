// student-feedback.js – PHIÊN BẢN HOÀN HẢO NHƯ TUTOR, MƯỢT 100%
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.querySelector('.editor');
  const toolbarBtns = document.querySelectorAll('.toolbar button[data-command]');
  const stars = document.querySelectorAll('.stars i');
  const ratingText = document.querySelector('.rating span');
  let currentRating = 0;

  // === 1. PLACEHOLDER SIÊU MƯỢT – CLICK LÀ MẤT NGAY, HIỆN CON TRỎ NHÁY ===
  editor.dataset.placeholder = "Sinh viên đưa ra phản hồi tại đây";
  editor.innerHTML = ''; // rỗng hoàn toàn

  const togglePlaceholder = () => {
    const isEmpty = editor.innerHTML === '' || 
                    editor.innerHTML === '<br>' || 
                    editor.innerHTML === '<div><br></div>';
    editor.classList.toggle('empty', isEmpty);
  };

  // Click/focus → mất placeholder ngay, hiện con trỏ
  editor.addEventListener('focus', () => {
    editor.classList.remove('empty');
    // Đảm bảo con trỏ hiện ngay lập tức
    if (isEmpty) editor.innerHTML = '';
  });

  // Khi bỏ focus → kiểm tra có nội dung không
  editor.addEventListener('blur', togglePlaceholder);

  // Khi gõ, paste, xóa → cập nhật trạng thái
  editor.addEventListener('input', togglePlaceholder);
  editor.addEventListener('keyup', togglePlaceholder);
  editor.addEventListener('paste', () => setTimeout(togglePlaceholder, 0));

  // Khởi động lần đầu
  togglePlaceholder();

  // === 2. TOOLBAR – SÁNG ĐÚNG, KHÔNG KẸT, TẮT/BẬT CHUẨN ===
  const updateActiveButtons = () => {
    toolbarBtns.forEach(btn => btn.classList.remove('active'));

    const commands = ['bold', 'italic', 'underline', 'strikeThrough',
                      'justifyLeft', 'justifyCenter', 'justifyRight',
                      'insertUnorderedList', 'insertOrderedList'];

    commands.forEach(cmd => {
      const btn = [...toolbarBtns].find(b => b.dataset.command === cmd);
      if (!btn) return;
      try {
        if (document.queryCommandState(cmd)) {
          btn.classList.add('active');
          // Xử lý nhóm căn lề: chỉ 1 cái được bật
          if (cmd === 'justifyCenter' || cmd === 'justifyRight') {
            [...toolbarBtns].find(b => b.dataset.command === 'justifyLeft')?.classList.remove('active');
          }
        }
      } catch (e) {}
    });
  };

  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.command;
      editor.focus();

      if (cmd === 'createLink') {
        const url = prompt('Nhập link:', 'https://');
        if (url) document.execCommand(cmd, false, url);
      } else if (cmd === 'insertImage') {
        const url = prompt('Nhập URL ảnh:');
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }

      setTimeout(updateActiveButtons, 50);
    });
  });

  // Cập nhật toolbar khi thao tác
  editor.addEventListener('keyup', () => setTimeout(updateActiveButtons, 10));
  editor.addEventListener('mouseup', () => setTimeout(updateActiveButtons, 10));
  editor.addEventListener('focus', () => setTimeout(updateActiveButtons, 100));
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === editor) setTimeout(updateActiveButtons, 10);
  });

  // Khởi tạo: căn lề trái, tắt hết định dạng
  setTimeout(() => {
    document.execCommand('justifyLeft', false, null);
    updateActiveButtons();
  }, 100);

  // === 3. ĐÁNH GIÁ SAO ===
  const updateStars = () => {
    stars.forEach((star, i) => star.classList.toggle('filled', i < currentRating));
    ratingText.textContent = `${currentRating} / 5`;
  };
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      currentRating = i + 1;
      updateStars();
    });
  });

  // === 4. NÚT XÓA ===
  document.querySelector('.clear').addEventListener('click', () => {
    editor.innerHTML = '';
    togglePlaceholder();
    currentRating = 0;
    updateStars();
    setTimeout(() => {
      document.execCommand('justifyLeft', false, null);
      updateActiveButtons();
    }, 50);
  });

  // === 5. NÚT GỬI ===
  document.querySelector('.submit').addEventListener('click', () => {
    const text = editor.innerText.trim();
    if (!text || editor.classList.contains('empty')) {
      alert('Vui lòng nhập phản hồi trước khi gửi!');
      return;
    }
    alert(`Đã gửi thành công!\n\nNội dung: "${text}"\nĐánh giá: ${currentRating}/5`);
  });
});