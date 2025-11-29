// student-feedback.js - PHIÊN BẢN KẾT HỢP LOGIC API VÀ HIỆU ỨNG TOOLBAR
document.addEventListener('DOMContentLoaded', () => {
  // --- Biến giao diện ---
  const courseSelect = document.getElementById('courseSelect');
  const sessionSelect = document.getElementById('sessionSelect');
  const editor = document.querySelector('.editor');
  const toolbarBtns = document.querySelectorAll('.toolbar button[data-command]');
  const stars = document.querySelectorAll('.stars i');
  const ratingText = document.querySelector('.rating span');
  const feedbackMsg = document.getElementById('feedback-message');
  let currentRating = 0;

  const successModal = new bootstrap.Modal(document.getElementById('successModal'));

  // === 1. PLACEHOLDER VÀ EDITOR (GIỮ NGUYÊN) ===
  editor.dataset.placeholder = "Sinh viên đưa ra phản hồi tại đây";
  editor.innerHTML = ''; 

  const togglePlaceholder = () => {
    const isEmpty = editor.innerHTML.trim() === '' || editor.innerHTML === '<br>' || editor.innerHTML === '<div><br></div>';
    editor.classList.toggle('empty', isEmpty);
  };

  editor.addEventListener('focus', () => {
    if (editor.classList.contains('empty')) {
      editor.classList.remove('empty');
    }
  });
  editor.addEventListener('blur', togglePlaceholder);
  editor.addEventListener('input', togglePlaceholder);
  togglePlaceholder();

  // === 2. TOOLBAR (GIỮ NGUYÊN) ===
  const updateActiveButtons = () => {
    toolbarBtns.forEach(btn => btn.classList.remove('active'));
    const commands = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertUnorderedList', 'insertOrderedList'];
    commands.forEach(cmd => {
      const btn = [...toolbarBtns].find(b => b.dataset.command === cmd);
      if (btn && document.queryCommandState(cmd)) {
        btn.classList.add('active');
      }
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

  const debouncedUpdate = () => setTimeout(updateActiveButtons, 10);
  editor.addEventListener('keyup', debouncedUpdate);
  editor.addEventListener('mouseup', debouncedUpdate);
  editor.addEventListener('focus', debouncedUpdate);
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === editor) debouncedUpdate();
  });
  setTimeout(() => {
    document.execCommand('justifyLeft', false, null);
    updateActiveButtons();
  }, 100);

  // === 3. ĐÁNH GIÁ SAO (GIỮ NGUYÊN) ===
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

  // === 4. HÀM RESET FORM VÀ NÚT XÓA (GIỮ NGUYÊN) ===
  function resetForm() {
    editor.innerHTML = '';
    togglePlaceholder();
    currentRating = 0;
    updateStars();
    courseSelect.value = '';
    sessionSelect.innerHTML = '<option value="">-- Chọn buổi học --</option>';
    sessionSelect.disabled = true;
    setTimeout(() => {
      document.execCommand('justifyLeft', false, null);
      updateActiveButtons();
    }, 50);
  }

  document.querySelector('.clear').addEventListener('click', () => {
    feedbackMsg.textContent = '';
    resetForm();
  });

  // === 5. LOGIC API VÀ FORM ===

  // --- API functions ---
  async function getCoursesAPI() {
    try {
      const resp = await fetch('/api/data/courses.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  async function getFeedbackAPI() {
    try {
      const resp = await fetch('/api/data/stu-feedback.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  async function saveFeedbackAPI(feedbackArr) {
    try {
      const resp = await fetch('/api/data/stu-feedback.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackArr, null, 2)
      });
      return resp.ok;
    } catch (e) { return false; }
  }
  
  // THAY ĐỔI: Thêm hàm lấy dữ liệu sinh viên
  async function getStudentsAPI() {
    try {
      const resp = await fetch('/api/data/stu.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  // --- Load khóa học và xử lý chọn lựa ---
  let coursesGlobal = [];
  courseSelect.addEventListener('change', function() {
    const courseId = courseSelect.value;
    sessionSelect.innerHTML = '<option value="">-- Chọn buổi học --</option>';
    sessionSelect.disabled = true;
    if (!courseId) return;

    const course = coursesGlobal.find(c => c.id === courseId);
    if (course && Array.isArray(course.sessions)) {
      course.sessions.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.topic} (${s.date})`;
        sessionSelect.appendChild(opt);
      });
      sessionSelect.disabled = false;
    }
  });

  // THAY ĐỔI: Cập nhật logic hàm init()
  (async function init() {
    const userFromStorage = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const username = userFromStorage.username;

    if (!username) {
        courseSelect.innerHTML = '<option value="">-- Lỗi: Không tìm thấy người dùng --</option>';
        courseSelect.disabled = true;
        return;
    }

    // Tải song song dữ liệu khóa học và sinh viên
    const [allCourses, allStudents] = await Promise.all([
        getCoursesAPI(),
        getStudentsAPI()
    ]);

    // Tìm thông tin mới nhất của sinh viên từ server
    const currentStudent = allStudents.find(s => s.username === username);
    const registeredCourseIds = (currentStudent?.registeredCourses || []).map(rc => rc.courseId);

    // Lọc lại danh sách khóa học toàn cục để chỉ chứa các khóa đã đăng ký
    coursesGlobal = allCourses.filter(course => registeredCourseIds.includes(course.id));

    // Cập nhật dropdown với các khóa học đã lọc
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    if (coursesGlobal.length > 0) {
        coursesGlobal.forEach(c => {
            const courseName = c.name || c.courseName || c.title || 'Không tên';
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${courseName} (${c.id})`;
            courseSelect.appendChild(opt);
        });
    } else {
        // Xử lý trường hợp sinh viên chưa đăng ký khóa nào
        courseSelect.innerHTML = '<option value="">-- Bạn chưa đăng ký khóa học nào --</option>';
        courseSelect.disabled = true;
    }
  })();

  // === 6. NÚT GỬI PHẢN HỒI (GIỮ NGUYÊN) ===
  document.querySelector('.submit').addEventListener('click', async () => {
    feedbackMsg.textContent = '';
    const text = editor.innerText.trim();
    const courseId = courseSelect.value;
    const sessionId = sessionSelect.value;
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const studentId = loggedInUser.id || loggedInUser.username || '';

    // --- Validation ---
    if (!courseId) {
      feedbackMsg.textContent = 'Vui lòng chọn khóa học!'; return;
    }
    if (!sessionId) {
      feedbackMsg.textContent = 'Vui lòng chọn buổi học!'; return;
    }
    if (!text || editor.classList.contains('empty')) {
      feedbackMsg.textContent = 'Vui lòng nhập phản hồi trước khi gửi!'; return;
    }
    if (currentRating === 0) {
      feedbackMsg.textContent = 'Vui lòng chọn số sao đánh giá!'; return;
    }
    if (!studentId) {
      feedbackMsg.textContent = 'Lỗi: Không xác định được sinh viên!'; return;
    }

    // --- Tạo và gửi feedback ---
    const feedbackId = `f_${Date.now()}_${studentId}_${sessionId}`;
    const feedbackObj = {
      id: feedbackId,
      studentId: String(studentId),
      courseId: courseId,
      sessionId: sessionId,
      rating: currentRating,
      content: text,
      timestamp: new Date().toISOString()
    };

    let feedbackArr = await getFeedbackAPI();
    feedbackArr.push(feedbackObj);
    const ok = await saveFeedbackAPI(feedbackArr);

    // --- Hiển thị modal ---
    if (ok) {
      resetForm();
      successModal.show();
    } else {
      feedbackMsg.style.color = '#d00';
      feedbackMsg.textContent = 'Lỗi: Không thể gửi phản hồi. Vui lòng thử lại.';
    }
  });
});