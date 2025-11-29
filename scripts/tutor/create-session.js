// scripts/tutor/create-session.js
// Xử lý tạo buổi học cho một khóa học đã chọn.
document.addEventListener('DOMContentLoaded', () => {
  const courseSelect = document.getElementById('courseSelect');
  const form = document.getElementById('createSessionForm');
  const btnChoose = document.getElementById('btnChooseSchedule');
  const chosenContainer = document.getElementById('selectedSchedules');
  const sessionMsg = document.getElementById('sessionMessage');

  // modal elements
  const chooseModal = new bootstrap.Modal(document.getElementById('chooseScheduleModal'));
  const scheduleDate = document.getElementById('scheduleDate');
  const startTime = document.getElementById('startTime');
  const endTime = document.getElementById('endTime');
  const addScheduleBtn = document.getElementById('addScheduleBtn');

  // Prefill inputs with last used values (persisted in localStorage)
  function loadLastScheduleInputs() {
    try {
      const lastDate = localStorage.getItem('session.lastDate');
      const lastStart = localStorage.getItem('session.lastStart');
      const lastEnd = localStorage.getItem('session.lastEnd');
      if (lastDate) scheduleDate.value = lastDate;
      if (lastStart) startTime.value = lastStart;
      if (lastEnd) endTime.value = lastEnd;
    } catch (_) {}
  }

  function saveLastScheduleInputs() {
    try {
      if (scheduleDate.value) localStorage.setItem('session.lastDate', scheduleDate.value);
      if (startTime.value) localStorage.setItem('session.lastStart', startTime.value);
      if (endTime.value) localStorage.setItem('session.lastEnd', endTime.value);
    } catch (_) {}
  }

  // Lấy tutor hiện tại từ localStorage (ưu tiên loggedInUser)
  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser') || 'null';
      return JSON.parse(raw);
    } catch (e) { return null; }
  })();
  const currentTutorId = currentUser && (currentUser.id || currentUser.username)
    ? (currentUser.id || currentUser.username)
    : null;

  // Chuẩn hóa ngày về định dạng dd-mm-yyyy để hiển thị nhất quán
  function toDDMMYYYYDash(value) {
    if (!value) return '';
    // yyyy-mm-dd -> dd-mm-yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yyyy, mm, dd] = value.split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
    // dd/mm/yyyy -> dd-mm-yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split('/');
      return `${dd}-${mm}-${yyyy}`;
    }
    // dd-mm-yyyy -> giữ nguyên
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
    // Fallback Date parse
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    return value;
  }

  // Đọc/lưu courses qua API để đồng bộ với các trang khác
  async function getCoursesAPI() {
    try {
      const resp = await fetch('/api/data/courses.json', { cache: 'no-store' });
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  async function saveCoursesAPI(courses){
    try {
      const resp = await fetch('/api/data/courses.json', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courses)
      });
      return resp.ok;
    } catch (e) { return false; }
  }

  // --- ID generator: tạo ID duy nhất không phụ thuộc cấu trúc courseId
  function generateUniqueSessionId(prefix = 'session') {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return `${prefix}_${window.crypto.randomUUID()}`;
      }
    } catch (_) {}
    const ts = Date.now();
    const rnd = Math.floor(Math.random() * 0xFFFFFFFF);
    generateUniqueSessionId._cnt = (generateUniqueSessionId._cnt || 0) + 1;
    return `${prefix}_${ts.toString(36)}_${rnd.toString(36)}_${generateUniqueSessionId._cnt}`;
  }

  // populate courseSelect; if URL has courseId, preselect and disable
  const params = new URLSearchParams(window.location.search);
  const urlCourseId = params.get('courseId');

  async function populateCourses() {
    const courses = await getCoursesAPI();
    // Lọc chỉ các khóa học mà tutor hiện tại là người tạo
    const myCourses = courses.filter(c => Array.isArray(c.tutors) && c.tutors.some(t => t.id === currentTutorId));
    window.coursesGlobal = myCourses;
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    myCourses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title || ('Khóa ' + c.id);
      courseSelect.appendChild(opt);
    });
    if (urlCourseId) {
      courseSelect.value = urlCourseId;
      courseSelect.disabled = true;
    }
  }

  // gọi async populate
  populateCourses();

  // schedules array for current new session
  const schedules = [];

  function renderSchedules() {
    chosenContainer.innerHTML = '';
    if (schedules.length === 0) {
      chosenContainer.innerHTML = '<small class="text-muted">Chưa có lịch nào được chọn</small>';
      return;
    }
    schedules.forEach((s, idx) => {
      const d = document.createElement('div');
      d.className = 'badge bg-light text-dark me-2 mb-1';
      d.style.padding = '8px';
      d.innerHTML = `${s.date} (${s.start} - ${s.end}) <button type="button" class="btn-close btn-close-small ms-2" aria-label="Xóa" data-idx="${idx}"></button>`;
      chosenContainer.appendChild(d);
    });
    // attach delete handlers
    Array.from(chosenContainer.querySelectorAll('.btn-close-small')).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.idx, 10);
        schedules.splice(i,1);
        renderSchedules();
      });
    });
  }

  btnChoose.addEventListener('click', () => {
    // mỗi lần mở modal, nạp lại giá trị lần nhập trước (nếu có)
    loadLastScheduleInputs();
    chooseModal.show();
  });

  addScheduleBtn.addEventListener('click', () => {
    let date = scheduleDate.value;
    const start = startTime.value;
    const end = endTime.value;
    if (!date || !start || !end) {
      alert('Vui lòng chọn ngày, thời gian bắt đầu và kết thúc.');
      return;
    }
    // simple validation: start < end
    if (start >= end) { alert('Thời gian bắt đầu phải trước thời gian kết thúc.'); return; }

    // Hiển thị dạng dd-mm-yyyy trong badge
    date = toDDMMYYYYDash(date);
    schedules.push({ date, start, end });
    // lưu lại lần nhập để lần sau mở modal sẽ có sẵn
    saveLastScheduleInputs();
    renderSchedules();
    chooseModal.hide();
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    sessionMsg.textContent = '';
    const courseId = courseSelect.value;
    const topic = document.getElementById('sessionTopic').value.trim();
    const description = document.getElementById('sessionDescription').value.trim();
    const mode = document.getElementById('sessionMode').value;
    const location = document.getElementById('sessionLocation').value.trim();

    if (!courseId) { sessionMsg.textContent = 'Vui lòng chọn khóa học.'; return; }
    if (!topic) { sessionMsg.textContent = 'Vui lòng nhập chủ đề.'; return; }
    if (schedules.length === 0) { sessionMsg.textContent = 'Vui lòng chọn ít nhất một lịch cho buổi học.'; return; }

    // build session object (one session may contain multiple date-time entries; we will create one session entry per schedule)
    const courses = await getCoursesAPI();
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx === -1) { sessionMsg.textContent = 'Không tìm thấy khóa học.'; return; }

    // Tạo session cho mỗi lịch với ID tự sinh unique
    schedules.forEach(s => {
      const sessionId = generateUniqueSessionId('session');
      // Nếu không lấy được từ loggedInUser, fallback course.tutors[0].id (nếu có)
      const fallbackTutorId = (courses[idx] && Array.isArray(courses[idx].tutors) && courses[idx].tutors[0])
        ? courses[idx].tutors[0].id : null;
      const tutorId = currentTutorId || fallbackTutorId || null;
      const session = {
        id: sessionId,
        tutorId,
        topic,
        description,
        date: s.date,
        start: s.start,
        end: s.end,
        mode,
        location
      };
      if (!Array.isArray(courses[idx].sessions)) courses[idx].sessions = [];
      // Kiểm tra trùng lặp theo id hoặc chủ đề/ngày/giờ
      const isDuplicate = courses[idx].sessions.some(sess =>
        sess.id === session.id ||
        (sess.topic === session.topic && sess.date === session.date && sess.start === session.start && sess.end === session.end)
      );
      if (!isDuplicate) {
        courses[idx].sessions.push(session);
      }
    });

  // Lưu lại qua API để các trang khác nhận được
    await saveCoursesAPI(courses);
    sessionMsg.style.color = 'green';
    sessionMsg.textContent = 'Tạo buổi học thành công.';
    // redirect to manage-sessions for this course
    setTimeout(() => {
      window.location.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(courseId);
    }, 900);
  });
});
