// scripts/tutor/create-course.js
// Xử lý tạo khóa học mới cho tutor
// Yêu cầu:
// - Form có các field: title, description, durationMonths, sessionsPerWeek, maxStudents, price, tags
// - Dùng const/let, template strings
// - Validate từng field, show lỗi gần field
// - Lưu course vào localStorage (key = 'courses')
// - Redirect sang create-session.html?courseId=...

document.addEventListener('DOMContentLoaded', () => {
  // --- 1) Tham chiếu DOM ---
  const form = document.getElementById('createCourseForm');
  const inputs = {
    title: document.getElementById('courseTitle'),
    description: document.getElementById('courseDescription'),
    duration: document.getElementById('durationMonths'),
    sessionsPerWeek: document.getElementById('sessionsPerWeek'),
    maxStudents: document.getElementById('maxStudents'),
  };
  const messageEl = document.getElementById('formMessage');

  // --- 2) Helpers nhỏ để show/clear lỗi và message ---
  // Trả về element .invalid-feedback kế bên input (tạo nếu chưa có)
  function getFeedbackEl(inputEl) {
    let el = inputEl.parentNode.querySelector('.invalid-feedback');
    if (!el) {
      el = document.createElement('div');
      el.className = 'invalid-feedback';
      inputEl.parentNode.appendChild(el);
    }
    return el;
  }

  function showFieldError(inputEl, text) {
    inputEl.classList.add('is-invalid');
    getFeedbackEl(inputEl).textContent = text;
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('is-invalid');
    const fb = inputEl.parentNode.querySelector('.invalid-feedback');
    if (fb) fb.textContent = '';
  }

  function clearAllErrors() {
    Object.values(inputs).forEach(clearFieldError);
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.style.color = '';
    }
  }

  function showMessage(text, type = 'info') {
    // type: 'info' | 'success' | 'error'
    if (!messageEl) return;
    messageEl.textContent = text;
    if (type === 'error') messageEl.style.color = '#d9534f';
    else if (type === 'success') messageEl.style.color = 'var(--ts-primary, #2B8DB6)';
    else messageEl.style.color = '';
  }

  // --- 3) Helpers lấy/gửi dữ liệu qua API ---
  async function loadCoursesAPI() {
    try {
      const resp = await fetch('/api/data/courses.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  async function saveCoursesAPI(courses) {
    try {
      const resp = await fetch('/api/data/courses.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses)
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  // --- ID generation helpers (deterministic letter-based ids) ---
  async function generateCourseId() {
    const courses = await loadCoursesAPI();
    const used = new Set();
    (courses || []).forEach(c => {
      if (typeof c.id === 'string') {
        const m = c.id.match(/^([a-z])_\d{3}$/i);
        if (m) used.add(m[1].toLowerCase());
      }
    });
    for (let code = 97; code <= 122; code++) {
      const ch = String.fromCharCode(code);
      if (!used.has(ch)) return `${ch}_000`;
    }
    return 'z_000';
  }

  // Nếu có backend, bạn có thể thay block saveCourseToServer bằng fetch POST.
  // function postCourseToServer(course) { return fetch('/api/courses', {method:'POST', ...}) }

  // --- 4) Validation (đơn giản, dễ hiểu) ---
  // Trả về object các lỗi: { fieldName: 'error message', ... }
  function validate(values) {
    const errors = {};

    if (!values.title || values.title.length < 3) {
      errors.title = 'Tên khóa học là bắt buộc (ít nhất 3 ký tự).';
    }

    if (!values.description || values.description.length < 10) {
      errors.description = 'Mô tả là bắt buộc (ít nhất 10 ký tự).';
    }

    if (!Number.isInteger(values.duration) || values.duration < 1) {
      errors.duration = 'Thời gian (tháng) phải là số nguyên >= 1.';
    }

    if (!Number.isInteger(values.sessionsPerWeek) || values.sessionsPerWeek < 1) {
      errors.sessionsPerWeek = 'Số buổi/tuần phải là số nguyên >= 1.';
    }

    if (!Number.isInteger(values.maxStudents) || values.maxStudents < 1) {
      errors.maxStudents = 'Số lượng sinh viên tối đa phải là số nguyên >= 1.';
    }
    return errors;
  }

  // --- 5) Lắng nghe submit và xử lý ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();

    // Lấy và chuẩn hoá giá trị
    const rawTitle = inputs.title.value || '';
    const rawDesc = inputs.description.value || '';
    const rawDuration = inputs.duration.value;
    const rawSessions = inputs.sessionsPerWeek.value;
    const rawMax = inputs.maxStudents.value;

    const values = {
      title: rawTitle.trim(),
      description: rawDesc.trim(),
      duration: Number.isNaN(parseInt(rawDuration, 10)) ? NaN : parseInt(rawDuration, 10),
      sessionsPerWeek: Number.isNaN(parseInt(rawSessions, 10)) ? NaN : parseInt(rawSessions, 10),
      maxStudents: Number.isNaN(parseInt(rawMax, 10)) ? NaN : parseInt(rawMax, 10),
    };

    // Validate
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      // Show errors near fields (thứ tự hiển thị theo ưu tiên)
      if (errors.title) showFieldError(inputs.title, errors.title);
      if (errors.description) showFieldError(inputs.description, errors.description);
      if (errors.duration) showFieldError(inputs.duration, errors.duration);
      if (errors.sessionsPerWeek) showFieldError(inputs.sessionsPerWeek, errors.sessionsPerWeek);
      if (errors.maxStudents) showFieldError(inputs.maxStudents, errors.maxStudents);
      if (errors.price) showFieldError(inputs.price, errors.price);

      // focus vào field đầu có lỗi
      const firstField = Object.keys(errors)[0];
      if (firstField && inputs[firstField]) inputs[firstField].focus();

      showMessage('Vui lòng sửa các lỗi trong form rồi thử lại.', 'error');
      return;
    }

    (async () => {
      // Tạo object course mới (id determinisitc dạng letter_000)
      const courseId = await generateCourseId();
      const createdAt = new Date().toISOString();
      // Lấy tutor info đã login (login.js lưu 'loggedInUser'); fallback 'currentUser'
      const currentUser = (function () {
        try {
          const raw = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser') || 'null';
          return JSON.parse(raw);
        } catch (e) { return null; }
      })();
      const tutorId = currentUser && currentUser.id ? currentUser.id : null;

      // Chuẩn hóa tutors array cho course mới
      const tutorsArr = tutorId ? [{ id: tutorId, name: currentUser.fullName || '', rating: 0, reviews: 0, registered: 0 }] : [];


      // Thêm 2 trường: số lượng sinh viên đang học (numCurrentStudents), số lượng buổi học đang có (numCurrentSessions)
      const newCourse = {
        id: courseId,
        title: values.title,
        description: values.description,
        durationMonths: values.duration,
        sessionsPerWeek: values.sessionsPerWeek,
        maxStudents: values.maxStudents,
        createdAt,
        tutors: tutorsArr,
        sessions: [],
        numCurrentStudents: 0, // mặc định khi tạo mới
        numCurrentSessions: 0  // mặc định khi tạo mới
      };

      // Lưu vào courses.json qua API
      const list = await loadCoursesAPI();
      list.push(newCourse);
      const saved = await saveCoursesAPI(list);

      if (!saved) {
        showMessage('Lưu khóa học không thành công. Kiểm tra server hoặc thử lại.', 'error');
        return;
      }

      // --- Cập nhật trường courses của tutor trong tutor.json ---
      try {
        // Đọc tutor.json qua API
        const respTutor = await fetch('/api/data/tutor.json');
        const tutors = await respTutor.json();
        // Tìm đúng tutor
        const tutorIdx = tutors.findIndex(t => t.id === tutorId);
        if (tutorIdx !== -1) {
          const tutor = tutors[tutorIdx];
          if (!Array.isArray(tutor.courses)) tutor.courses = [];
          // Kiểm tra trùng courseId
          const exists = tutor.courses.some(c => c.courseId === courseId);
          if (!exists) {
            tutor.courses.push({ courseId, openedAt: createdAt });
            tutors[tutorIdx] = tutor;
            // Ghi lại tutor.json qua API
            await fetch('/api/data/tutor.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tutors)
            });
          }
        }
      } catch (err) {
        // Nếu lỗi vẫn tiếp tục, chỉ log ra console
        console.error('Không thể cập nhật trường courses cho tutor:', err);
      }

      showMessage('Tạo khóa học thành công.', 'success');
      setTimeout(() => {
        window.location.href = `/pages/tutor/create-session.html?courseId=${encodeURIComponent(courseId)}`;
      }, 700);
    })();
  });

  // --- 6) UX: clear lỗi khi user bắt đầu sửa field ---
  Object.values(inputs).forEach((inp) => {
    if (!inp) return;
    inp.addEventListener('input', () => {
      clearFieldError(inp);
      if (messageEl) messageEl.textContent = '';
    });
  });
});