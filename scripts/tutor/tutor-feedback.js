document.addEventListener('DOMContentLoaded', async () => {
  const editor = document.getElementById('commentEditor');
  const placeholderText = "Nhập nhận xét tại đây...";
  editor.setAttribute('data-placeholder', placeholderText);

  let feedbackMsg = document.getElementById('feedback-message');
  if (!feedbackMsg) {
    feedbackMsg = document.createElement('div');
    feedbackMsg.id = 'feedback-message';
    feedbackMsg.style = 'margin-top:16px;text-align:center;font-weight:500;';
    document.querySelector('.tutor-feedback-container').appendChild(feedbackMsg);
  }

  // === ĐỌC THÔNG TIN SINH VIÊN TỪ URL ===
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');
  const studentName = urlParams.get('name');
  const studentClass = urlParams.get('class') || 'L01';

  document.getElementById('studentDisplay').textContent =
    studentId && studentName ? `${studentName} _ ${studentId} _ ${studentClass}` : 'Không tìm thấy sinh viên';

  // === LOAD NHẬN XÉT CŨ ===
  let existingEvaluations = [];
  try {
    const res = await fetch('/data/evaluation.json');
    if (res.ok) existingEvaluations = await res.json();
  } catch (e) {}

  const existing = existingEvaluations.find(e => e.studentId === studentId);
  if (existing) {
    document.querySelector('input[placeholder="0"]').value = existing.absences || '';
    const inputs = document.querySelectorAll('.score-inputs input');
    inputs[1].value = existing.quiz1 || '';
    inputs[2].value = existing.quiz2 || '';
    inputs[3].value = existing.quiz3 || '';
    inputs[4].value = existing.midterm || '';
    editor.innerHTML = existing.comment || '';
  }


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
  updatePlaceholder(); // lần đầu

  // =================================================================
  // === TOOLBAR: LÀM NÚT SÁNG ĐÚNG KHI DÙNG ĐỊNH DẠNG ===
  // =================================================================
  function updateToolbarState() {
    document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
      const cmd = btn.getAttribute('data-command');
      btn.classList.remove('active');

      let isActive = false;
      try {
        if (['bold', 'italic', 'underline', 'strikeThrough',
             'insertUnorderedList', 'insertOrderedList',
             'justifyLeft', 'justifyCenter', 'justifyRight'].includes(cmd)) {
          isActive = document.queryCommandState(cmd);
        }
      } catch (e) {}

      if (isActive) btn.classList.add('active');
    });
  }

  // Cập nhật trạng thái liên tục
  editor.addEventListener('keyup', updateToolbarState);
  editor.addEventListener('mouseup', updateToolbarState);
  editor.addEventListener('click', updateToolbarState);
  editor.addEventListener('input', updateToolbarState);
  editor.addEventListener('focus', updateToolbarState);

  // Cập nhật ngay khi load (nếu có nội dung cũ đã định dạng)
  setTimeout(updateToolbarState, 100);

  // Xử lý click nút toolbar
  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-command');

      if (cmd === 'createLink') {
        const url = prompt('Nhập link:', 'https://');
        if (url) document.execCommand('createLink', false, url);
      }
      else if (cmd === 'insertImage') {
        const url = prompt('Nhập URL ảnh:', 'https://');
        if (url) document.execCommand('insertImage', false, url);
      }
      else {
        document.execCommand(cmd, false, null);
      }

      editor.focus();
      setTimeout(updateToolbarState, 10); // cực nhanh
    });
  });

  // =================================================================
  // === NÚT XÓA & GỬI ===
  // =================================================================
  document.querySelector('.btn-clear').addEventListener('click', () => {
    if (confirm('Xóa toàn bộ nhận xét và điểm của sinh viên này?')) {
      editor.innerHTML = '';
      updatePlaceholder();
      document.querySelectorAll('.score-inputs input').forEach(i => i.value = '');
      updateToolbarState();
    }
  });

  document.querySelector('.btn-submit').addEventListener('click', async () => {
    updatePlaceholder();
    let comment = editor.innerHTML.trim();
    if (editor.classList.contains('empty') || !editor.innerText.trim()) {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Vui lòng nhập nhận xét!';
      return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const tutorId = loggedInUser.username || 'unknown';

    const evaluation = {
      id: `te_${Date.now()}_${tutorId}_${studentId}`,
      tutorId: tutorId,
      studentId: studentId,
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
    } catch (e) {}

    // Xóa bản ghi cũ của tutor này với sinh viên này
    evaluations = evaluations.filter(e => !(e.tutorId === tutorId && e.studentId === studentId));
    evaluations.push(evaluation);

    try {
      const resp = await fetch('/api/data/tutor-evaluate.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluations)
      });
      if (resp.ok) {
        feedbackMsg.style.color = '#0BB965';
        feedbackMsg.textContent = 'Đã gửi nhận xét thành công!';
      } else throw new Error();
    } catch (e) {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Lỗi khi lưu nhận xét!';
    }
  });
});