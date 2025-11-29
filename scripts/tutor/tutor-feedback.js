document.addEventListener('DOMContentLoaded', async () => {
  const editor = document.getElementById('commentEditor');
  const placeholderText = "Nhập nhận xét tại đây...";
  editor.setAttribute('data-placeholder', placeholderText);

  let feedbackMsg = document.getElementById('feedback-message');
  if (!feedbackMsg) {
    feedbackMsg = document.createElement('div');
    feedbackMsg.id = 'feedback-message';
    feedbackMsg.style = 'margin-bottom: 16px; text-align:center; font-weight:500; color: #d00;';
    // Chèn vào trước action-buttons
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.parentNode.insertBefore(feedbackMsg, actionButtons);
  }

  // THAY ĐỔI: Khởi tạo modal
  const successModal = new bootstrap.Modal(document.getElementById('successModal'));

  // === ĐỌC THÔNG TIN SINH VIÊN TỪ URL (GIỮ NGUYÊN) ===
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');
  const studentName = urlParams.get('name');
  const studentClass = urlParams.get('class') || 'L01';
  const courseId = urlParams.get('courseId');

  document.getElementById('studentDisplay').textContent =
    studentId && studentName ? `${studentName} _ ${studentId} _ ${studentClass}` : 'Không tìm thấy sinh viên';

  // === CÁC HÀM TIỆN ÍCH (GIỮ NGUYÊN) ===
  function updatePlaceholder() {
    if (editor.innerHTML.trim() === '' || editor.innerHTML === `<span style="color:#aaa;">${placeholderText}</span>`) {
      editor.innerHTML = '';
      editor.classList.add('empty');
    } else {
      editor.classList.remove('empty');
    }
  }

  editor.addEventListener('focus', () => editor.classList.remove('empty'));
  editor.addEventListener('blur', updatePlaceholder);
  editor.addEventListener('input', updatePlaceholder);
  updatePlaceholder();

  // === TOOLBAR (GIỮ NGUYÊN) ===
  function updateToolbarState() {
    document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
      const cmd = btn.getAttribute('data-command');
      btn.classList.remove('active');
      let isActive = false;
      try {
        if (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight'].includes(cmd)) {
          isActive = document.queryCommandState(cmd);
        }
      } catch (e) {}
      if (isActive) btn.classList.add('active');
    });
  }
  ['keyup', 'mouseup', 'click', 'input', 'focus'].forEach(event => editor.addEventListener(event, updateToolbarState));
  setTimeout(updateToolbarState, 100);

  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-command');
      if (cmd === 'createLink') {
        const url = prompt('Nhập link:', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd === 'insertImage') {
        const url = prompt('Nhập URL ảnh:', 'https://');
        if (url) document.execCommand('insertImage', false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
      editor.focus();
      setTimeout(updateToolbarState, 10);
    });
  });

  // === THAY ĐỔI: TẠO HÀM RESET FORM ===
  function resetForm() {
      editor.innerHTML = '';
      updatePlaceholder();
      document.querySelectorAll('.score-inputs input').forEach(i => i.value = '');
      updateToolbarState();
      feedbackMsg.textContent = ''; // Xóa thông báo lỗi (nếu có)
  }

  // === NÚT XÓA & GỬI ===
  document.querySelector('.btn-clear').addEventListener('click', () => {
    if (confirm('Xóa toàn bộ nội dung đang nhập trên form?')) {
      resetForm();
    }
  });

  document.querySelector('.btn-submit').addEventListener('click', async () => {
    updatePlaceholder();
    feedbackMsg.textContent = ''; // Xóa thông báo cũ
    let comment = editor.innerHTML.trim();
    if (editor.classList.contains('empty') || !editor.innerText.trim()) {
      feedbackMsg.textContent = 'Vui lòng nhập nhận xét!';
      return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const tutorId = loggedInUser.username || 'unknown';

    const evaluation = {
      id: `te_${Date.now()}_${tutorId}_${studentId}`,
      tutorId: tutorId,
      studentId: studentId,
      courseId: courseId || 'not-specified',
      absences: document.querySelector('input[placeholder="0"]').value || '0',
      quiz1: document.querySelectorAll('.score-inputs input')[1].value || '0',
      quiz2: document.querySelectorAll('.score-inputs input')[2].value || '0',
      quiz3: document.querySelectorAll('.score-inputs input')[3].value || '0',
      midterm: document.querySelectorAll('.score-inputs input')[4].value || '0',
      comment: comment
    };

    let evaluations = [];
    try {
      const res = await fetch('/api/data/tutor-evaluate.json');
      if (res.ok) evaluations = await res.json();
    } catch (e) { /* Bỏ qua lỗi nếu file chưa tồn tại */ }

    evaluations.push(evaluation);

    try {
      const resp = await fetch('/api/data/tutor-evaluate.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluations, null, 2)
      });
      if (resp.ok) {
        // THAY ĐỔI: Hiển thị modal và reset form
        resetForm();
        successModal.show();
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (e) {
      feedbackMsg.textContent = 'Lỗi khi lưu nhận xét!';
      console.error(e);
    }
  });
});