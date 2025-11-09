document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('commentEditor');
  const placeholderText = "Nhập nhận xét tại đây...";
  editor.setAttribute('data-placeholder', placeholderText);

  // Khởi tạo editor rỗng
  if (!editor.innerHTML.trim() || editor.innerHTML === placeholderText) {
    editor.innerHTML = '';
  }

  // === XỬ LÝ PLACEHOLDER CHO CONTENTEDITABLE ===
  const showPlaceholder = () => {
    if (!editor.innerHTML.trim()) {
      editor.innerHTML = `<span style="color:#aaa;">${placeholderText}</span>`;
    }
  };

  const hidePlaceholder = () => {
    if (editor.innerHTML === `<span style="color:#aaa;">${placeholderText}</span>` ||
        editor.innerHTML.includes(placeholderText)) {
      editor.innerHTML = '';
    }
  };

  editor.addEventListener('focus', () => {
    hidePlaceholder();
  });

  editor.addEventListener('blur', () => {
    showPlaceholder();
  });

  // Giữ placeholder khi load
  showPlaceholder();

  // === THANH CÔNG CỤ ĐỊNH DẠNG ===
  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.getAttribute('data-command');

      if (command === 'createLink') {
        const url = prompt('Nhập link:', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } 
      else if (command === 'insertImage') {
        const url = prompt('Nhập URL hình ảnh:', 'https://');
        if (url) {
          document.execCommand('insertImage', false, url);
        }
      }
      else {
        document.execCommand(command, false, null);
      }

      editor.focus();
    });
  });

  // === NÚT XÓA ===
  document.querySelector('.btn-clear').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ nhận xét?')) {
      editor.innerHTML = '';
      showPlaceholder();
      
      // Xóa điểm
      document.querySelectorAll('.score-inputs input').forEach(inp => inp.value = '');
      
      alert('Đã xóa toàn bộ!');
    }
  });

  // === NÚT GỬI ===
  document.querySelector('.btn-submit').addEventListener('click', () => {
    hidePlaceholder();
    const comment = editor.innerText.trim();
    
    if (!comment || comment === placeholderText) {
      alert('Vui lòng nhập nhận xét trước khi gửi!');
      return;
    }

    // Lấy điểm
    const absences = document.querySelector('input[placeholder="0"]').value || '0';
    const quiz1 = document.querySelectorAll('.score-inputs input')[1].value || '0';
    const quiz2 = document.querySelectorAll('.score-inputs input')[2].value || '0';
    const quiz3 = document.querySelectorAll('.score-inputs input')[3].value || '0';
    const midterm = document.querySelectorAll('.score-inputs input')[4].value || '0';

    const feedbackData = {
      student: document.querySelector('.student-info strong').textContent.trim(),
      absences: absences,
      quiz1: quiz1,
      quiz2: quiz2,
      quiz3: quiz3,
      midterm: midterm,
      comment: editor.innerHTML  // giữ định dạng HTML
    };

    console.log('Đang gửi:', feedbackData);
    alert(`Đã gửi thành công!\n\nĐiểm: ${absences} vắng, Q1:${quiz1}, Q2:${quiz2}, Q3:${quiz3}, Mid:${midterm}\nNhận xét: ${comment.substring(0, 50)}...`);

    // Gửi thật:
    // fetch('/api/tutor/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(feedbackData)
    // })
  });
});