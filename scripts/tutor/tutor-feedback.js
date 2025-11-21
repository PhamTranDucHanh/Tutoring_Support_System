document.addEventListener('DOMContentLoaded', async () => {
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

  // === NÚT GỬI → LƯU VÀO evaluation.json ===
  document.querySelector('.btn-submit').addEventListener('click', async () => {
    hidePlaceholder();
    const comment = editor.innerHTML.trim();
    const plainText = editor.innerText.trim();

    if (!plainText) {
      alert('Vui lòng nhập nhận xét!');
      return;
    }

    const data = {
      studentId: studentId,
      studentName: studentName,
      class: studentClass,
      absences: document.querySelector('input[placeholder="0"]').value || '0',
      quiz1: document.querySelectorAll('.score-inputs input')[1].value || '0',
      quiz2: document.querySelectorAll('.score-inputs input')[2].value || '0',
      quiz3: document.querySelectorAll('.score-inputs input')[3].value || '0',
      midterm: document.querySelectorAll('.score-inputs input')[4].value || '0',
      comment: comment,                    // giữ HTML
      commentPlainText: plainText,         // để tìm kiếm dễ hơn
      submittedAt: new Date().toISOString(),
      tutor: "Tên tutor hiện tại"          // bạn có thể lấy từ auth sau
    };

    // Lưu vào file evaluation.json (chỉ hoạt động tốt với live server hỗ trợ fetch + write, hoặc dùng github + github pages + storage khác)
    // Ở đây mình dùng cách "giả lập lưu" bằng download file (rất tiện cho đồ án)

    let evaluations = [];
    try {
      const res = await fetch('/data/evaluation.json');
      if (res.ok) evaluations = await res.json();
    } catch(e) {}

    // Xóa nhận xét cũ của sinh viên này (nếu có)
    evaluations = evaluations.filter(e => e.studentId !== studentId);
    // Thêm mới
    evaluations.push(data);

    // Tạo file JSON để download (phù hợp đồ án, không cần backend)
    const blob = new Blob([JSON.stringify(evaluations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation.json';
    a.click();
    URL.revokeObjectURL(url);

    alert(`Đã lưu nhận xét cho ${studentName} thành công!\nFileight vừa tải file evaluation.json mới nhất.`);
  });
});