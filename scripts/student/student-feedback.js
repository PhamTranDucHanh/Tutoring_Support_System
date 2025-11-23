// ===== student-feedback.js – PHIÊN BẢN HOÀN HẢO, KHÔNG CÒN BUG PLACEHOLDER =====
document.addEventListener('DOMContentLoaded', () => {
  // --- Biến giao diện ---
  const courseSelect = document.getElementById('courseSelect');
  const sessionSelect = document.getElementById('sessionSelect');
  const editor = document.querySelector('.editor');
  const placeholderText = "Sinh viên đưa ra phản hồi tại đây";
  const feedbackMsg = document.getElementById('feedback-message');

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
    feedbackMsg.textContent = '';
  });

  // --- API: lấy danh sách khóa học ---
  async function getCoursesAPI() {
    try {
      const resp = await fetch('/api/data/courses.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  // --- API: lấy feedback hiện tại ---
  async function getFeedbackAPI() {
    try {
      const resp = await fetch('/api/data/stu-feedback.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  // --- API: ghi feedback ---
  async function saveFeedbackAPI(feedbackArr) {
    try {
      const resp = await fetch('/api/data/stu-feedback.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackArr)
      });
      return resp.ok;
    } catch (e) { return false; }
  }

  // --- Load khóa học ---
  let coursesGlobal = [];
  let sessionsGlobal = [];
  courseSelect.addEventListener('change', async function() {
    const courseId = courseSelect.value;
    sessionSelect.innerHTML = '<option value="">-- Chọn buổi học --</option>';
    sessionSelect.disabled = true;
    if (!courseId) return;
    // Tìm khóa học và load session
    const course = coursesGlobal.find(c => c.id === courseId);
    if (course && Array.isArray(course.sessions)) {
      sessionsGlobal = course.sessions;
      course.sessions.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.topic} (${s.id})`;
        sessionSelect.appendChild(opt);
      });
      sessionSelect.disabled = false;
    }
  });

  // --- Khởi tạo giao diện khóa học ---
  (async function() {
    coursesGlobal = await getCoursesAPI();
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    coursesGlobal.forEach(c => {
      // Đảm bảo lấy đúng tên khóa học
      let courseName = c.name || c.courseName || c.title || 'Không tên';
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${courseName} (${c.id})`;
      courseSelect.appendChild(opt);
    });
  })();

  // === NÚT GỬI ===
  document.querySelector('.submit').addEventListener('click', async () => {
    feedbackMsg.textContent = '';
    const text = editor.textContent.trim();
    const courseId = courseSelect.value;
    const sessionId = sessionSelect.value;
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    // Lấy đúng id sinh viên (vd: 2310896)
    const studentId = loggedInUser.id || loggedInUser.username || '';

    if (!courseId) {
      feedbackMsg.textContent = 'Vui lòng chọn khóa học!';
      return;
    }
    if (!sessionId) {
      feedbackMsg.textContent = 'Vui lòng chọn buổi học!';
      return;
    }
    if (isEmpty || text === placeholderText) {
      feedbackMsg.textContent = 'Vui lòng nhập phản hồi trước khi gửi!';
      return;
    }
    if (!currentRating || currentRating < 1 || currentRating > 5) {
      feedbackMsg.textContent = 'Vui lòng chọn số sao đánh giá!';
      return;
    }
    if (!studentId) {
      feedbackMsg.textContent = 'Không xác định được sinh viên!';
      return;
    }

    // Tạo id feedback: f_<timestamp>_<studentId>_<sessionId>
    const feedbackId = `f_${Date.now()}_${studentId}_${sessionId}`;
    // Tạo đối tượng feedback 
    const feedbackObj = {
      id: feedbackId,
      studentId: studentId,
      courseId: courseId,
      sessionId: sessionId,
      rating: currentRating,
      content: text
    };

    // Đọc feedback hiện tại, thêm mới, ghi lại
    let feedbackArr = await getFeedbackAPI();
    feedbackArr.push(feedbackObj);
    const ok = await saveFeedbackAPI(feedbackArr);
    if (ok) {
      feedbackMsg.style.color = '#0BB965';
      feedbackMsg.textContent = 'Gửi phản hồi thành công!';
      // Reset form
      editor.textContent = placeholderText;
      editor.classList.add('placeholder');
      isEmpty = true;
      currentRating = 0;
      updateStars();
      ratingText.textContent = '0 / 5';
      courseSelect.value = '';
      sessionSelect.innerHTML = '<option value="">-- Chọn buổi học --</option>';
      sessionSelect.disabled = true;
    } else {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Lỗi khi gửi phản hồi!';
    }
  });

  // === THANH CÔNG CỤ ĐỊNH DẠNG ===
  document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-command');
      document.execCommand(cmd, false, null);
      editor.focus();
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
});