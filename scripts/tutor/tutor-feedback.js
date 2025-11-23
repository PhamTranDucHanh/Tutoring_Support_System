document.addEventListener('DOMContentLoaded', async () => {
    // Thêm vùng hiển thị thông báo gửi thành công
    let feedbackMsg = document.getElementById('feedback-message');
    if (!feedbackMsg) {
      feedbackMsg = document.createElement('div');
      feedbackMsg.id = 'feedback-message';
      feedbackMsg.style = 'margin-top:16px;text-align:center;color:#0BB965;font-weight:500;';
      document.querySelector('.tutor-feedback-container').appendChild(feedbackMsg);
    }
  const editor = document.getElementById('commentEditor');
  const placeholderText = "Nhập nhận xét tại đây...";
  editor.setAttribute('data-placeholder', placeholderText);

  // === ĐỌC THAM SỐ TỪ URL ===
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');
  const studentName = urlParams.get('name');
  const studentClass = urlParams.get('class') || 'L01';

  if (studentId && studentName) {
    document.getElementById('studentDisplay').textContent = 
      `${studentName} _ ${studentId} _ ${studentClass}`;
  } else {
    document.getElementById('studentDisplay').textContent = 'Không tìm thấy sinh viên';
  }

  // === LOAD NHẬN XÉT CŨ NẾU CÓ (từ evaluation.json) ===
  let existingEvaluations = [];
  try {
    const res = await fetch('/data/evaluation.json');
    if (res.ok) existingEvaluations = await res.json();
  } catch(e) { console.log("Chưa có evaluation.json hoặc lỗi"); }

  const existing = existingEvaluations.find(e => e.studentId === studentId);
  if (existing) {
    // Điền lại dữ liệu cũ
    document.querySelector('input[placeholder="0"]').value = existing.absences || '';
    document.querySelectorAll('.score-inputs input')[1].value = existing.quiz1 || '';
    document.querySelectorAll('.score-inputs input')[2].value = existing.quiz2 || '';
    document.querySelectorAll('.score-inputs input')[3].value = existing.quiz3 || '';
    document.querySelectorAll('.score-inputs input')[4].value = existing.midterm || '';
    editor.innerHTML = existing.comment || '';
    if (editor.innerHTML) hidePlaceholder();
  }

  // === CÁC HÀM PLACEHOLDER (giữ nguyên như cũ) ===
  const showPlaceholder = () => {
    if (!editor.innerHTML.trim()) {
      editor.innerHTML = `<span style="color:#aaa;">${placeholderText}</span>`;
    }
  };
  const hidePlaceholder = () => {
    if (editor.innerHTML.includes(placeholderText)) {
      editor.innerHTML = '';
    }
  };
  editor.addEventListener('focus', hidePlaceholder);
  editor.addEventListener('blur', showPlaceholder);
  showPlaceholder();

  // === TOOLBAR (giữ nguyên) ===
  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.getAttribute('data-command');
      if (command === 'createLink') {
        const url = prompt('Nhập link:', 'https://');
        url && document.execCommand('createLink', false, url);
      } else if (command === 'insertImage') {
        const url = prompt('Nhập URL hình ảnh:', 'https://');
        url && document.execCommand('insertImage', false, url);
      } else {
        document.execCommand(command, false, null);
      }
      editor.focus();
    });
  });

  // === NÚT XÓA ===
  document.querySelector('.btn-clear').addEventListener('click', () => {
    if (confirm('Xóa toàn bộ nhận xét và điểm của sinh viên này?')) {
      editor.innerHTML = '';
      showPlaceholder();
      document.querySelectorAll('.score-inputs input').forEach(inp => inp.value = '');
    }
  });

  // === NÚT GỬI → LƯU VÀO tutor-evaluate.json qua API ===
  document.querySelector('.btn-submit').addEventListener('click', async () => {
    hidePlaceholder();
    // Lấy nội dung comment, loại bỏ đoạn comment thừa (nếu có)
    let comment = editor.innerHTML.trim();
    // Nếu comment chỉ là placeholder thì bỏ qua
    if (!comment || comment === `<span style="color:#aaa;">${placeholderText}</span>`) comment = '';
    const plainText = editor.innerText.trim();

    if (!plainText) {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Vui lòng nhập nhận xét!';
      return;
    }

    // Lấy thông tin tutor hiện tại
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const tutorId = loggedInUser.username || '';

    // Tạo đối tượng evaluation
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

    // Đọc file hiện tại
    let evaluations = [];
    try {
      const res = await fetch('/api/data/tutor-evaluate.json');
      if (res.ok) evaluations = await res.json();
    } catch(e) {}

    // Xóa nhận xét cũ của tutor với sinh viên này (nếu có)
    evaluations = evaluations.filter(e => !(e.tutorId === tutorId && e.studentId === studentId));
    // Thêm mới
    evaluations.push(evaluation);

    // Ghi lại qua API
    try {
      const resp = await fetch('/api/data/tutor-evaluate.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluations)
      });
      if (resp.ok) {
        feedbackMsg.style.color = '#0BB965';
        feedbackMsg.textContent = `Đã gửi nhận xét thành công!`;
      } else {
        feedbackMsg.style.color = '#d00';
        feedbackMsg.textContent = 'Lỗi khi lưu nhận xét!';
      }
    } catch(e) {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Lỗi khi lưu nhận xét!';
    }
  });
});