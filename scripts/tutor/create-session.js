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
  const chooseModalEl = document.getElementById('chooseScheduleModal');
  const scheduleDate = document.getElementById('scheduleDate');
  const startTime = document.getElementById('startTime');
  const endTime = document.getElementById('endTime');
  const addScheduleBtn = document.getElementById('addScheduleBtn');

  // -- Persist last-used start/end times so the modal can prefill them next time
  // We store per-course if possible, otherwise fall back to a global key.
  function _lsKey(courseId, part) {
    if (courseId) return `lastTime_${courseId}_${part}`;
    return `lastTime_global_${part}`;
  }

  function saveLastTimes(start, end) {
    const courseId = courseSelect && courseSelect.value ? courseSelect.value : '';
    try {
      localStorage.setItem(_lsKey(courseId, 'start'), start);
      localStorage.setItem(_lsKey(courseId, 'end'), end);
    } catch (e) {
      // ignore storage errors
    }
  }

  function getLastTimes() {
    const courseId = courseSelect && courseSelect.value ? courseSelect.value : '';
    // try per-course first
    let s = localStorage.getItem(_lsKey(courseId, 'start')) || '';
    let e = localStorage.getItem(_lsKey(courseId, 'end')) || '';
    // if per-course not set, fall back to global
    if (!s) s = localStorage.getItem(_lsKey('', 'start')) || '';
    if (!e) e = localStorage.getItem(_lsKey('', 'end')) || '';
    return { start: s, end: e };
  }

  // When the modal is shown, prefill start/end with last-used values (or leave as-is if none)
  if (chooseModalEl) {
    chooseModalEl.addEventListener('show.bs.modal', () => {
      const last = getLastTimes();
      // only set if there's a stored value; this preserves any value already typed
      if (last.start) startTime.value = last.start;
      if (last.end) endTime.value = last.end;
    });
  }

  // --- API helpers ---
  async function getCoursesAPI() {
    try {
      const resp = await fetch('/api/data/courses.json');
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  async function saveCoursesAPI(courses) {
    try {
      const resp = await fetch('/api/data/courses.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses)
      });
      return resp.ok;
    } catch (e) { return false; }
  }

  // --- ID generator for sessions following scheme: <letter>_001, <letter>_002, ...
  function generateSessionIdForCourse(courseId) {
    // courseId expected like 'a_000' -> letter = 'a'
    const m = (courseId || '').match(/^([a-zA-Z])_\d{3}$/);
    const letter = m ? m[1].toLowerCase() : 'x';
    // Đọc từ API (đồng bộ, chỉ dùng cho id, không ghi)
    // Lưu ý: hàm này chỉ dùng khi submit, không cần tối ưu hiệu năng
    // Sử dụng biến coursesGlobal nếu đã có
    const courses = window.coursesGlobal || [];
    const course = courses.find(c => c.id === courseId);
    let maxSeq = 0;
    if (course && Array.isArray(course.sessions)) {
      course.sessions.forEach(s => {
        const ms = (s.id || '').match(new RegExp('^' + letter + '_(\\d{3})$'));
        if (ms) {
          const n = parseInt(ms[1], 10);
          if (!isNaN(n) && n > maxSeq) maxSeq = n;
        }
      });
    }
    const next = maxSeq + 1;
    return `${letter}_${String(next).padStart(3,'0')}`;
  }

  // populate courseSelect; if URL has courseId, preselect and disable
  const params = new URLSearchParams(window.location.search);
  const urlCourseId = params.get('courseId');

  function populateCourses() {
    // Đọc từ API, lưu vào biến toàn cục để dùng cho id
    getCoursesAPI().then(courses => {
      window.coursesGlobal = courses;
      courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
      courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.title || ('Khóa ' + c.id);
        courseSelect.appendChild(opt);
      });
      if (urlCourseId) {
        courseSelect.value = urlCourseId;
        courseSelect.disabled = true;
      }
    });
  }

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

  btnChoose.addEventListener('click', () => chooseModal.show());

  addScheduleBtn.addEventListener('click', () => {
    const date = scheduleDate.value;
    const start = startTime.value;
    const end = endTime.value;
    if (!date || !start || !end) {
      alert('Vui lòng chọn ngày, thời gian bắt đầu và kết thúc.');
      return;
    }
    // simple validation: start < end
    if (start >= end) { alert('Thời gian bắt đầu phải trước thời gian kết thúc.'); return; }
    schedules.push({ date, start, end });
    // persist last-used times so next time the modal opens we can prefill
    try { saveLastTimes(start, end); } catch (e) { /* ignore */ }
    renderSchedules();
    chooseModal.hide();
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    sessionMsg.textContent = '';
    sessionMsg.style.color = '';
    const courseId = courseSelect.value;
    const topic = document.getElementById('sessionTopic').value.trim();
    const description = document.getElementById('sessionDescription').value.trim();
    const mode = document.getElementById('sessionMode').value;
    const location = document.getElementById('sessionLocation').value.trim();

    if (!courseId) { sessionMsg.style.color = 'red'; sessionMsg.textContent = 'Vui lòng chọn khóa học.'; return; }
    if (!topic) { sessionMsg.style.color = 'red'; sessionMsg.textContent = 'Vui lòng nhập chủ đề.'; return; }
    if (!location) { sessionMsg.style.color = 'red'; sessionMsg.textContent = 'Vui lòng nhập phòng học.'; return; }
    if (schedules.length === 0) { sessionMsg.style.color = 'red'; sessionMsg.textContent = 'Vui lòng chọn ít nhất một lịch cho buổi học.'; return; }

    (async () => {
      // Đọc courses từ biến toàn cục đã khởi tạo
      const courses = window.coursesGlobal || await getCoursesAPI();
      const idx = courses.findIndex(c => c.id === courseId);
      if (idx === -1) { sessionMsg.style.color = 'red'; sessionMsg.textContent = 'Không tìm thấy khóa học.'; return; }

      // Tạo session cho từng lịch đã chọn
      schedules.forEach(s => {
        const sessionId = generateSessionIdForCourse(courseId);
        const session = {
          id: sessionId,
          topic,
          description,
          date: s.date,
          start: s.start,
          end: s.end,
          mode,
          location
        };
        courses[idx].sessions = courses[idx].sessions || [];
        courses[idx].sessions.push(session);
      });

      // Tăng trường số lượng buổi học cho khóa học
      courses[idx].numCurrentSessions = Array.isArray(courses[idx].sessions) ? courses[idx].sessions.length : 0;

      // Ghi lại courses.json qua API
      const saved = await saveCoursesAPI(courses);
      if (!saved) {
        sessionMsg.style.color = 'red';
        sessionMsg.textContent = 'Không thể lưu buổi học. Vui lòng thử lại.';
        return;
      }
      sessionMsg.style.color = 'green';
      sessionMsg.textContent = 'Tạo buổi học thành công.';
      setTimeout(() => {
        window.location.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(courseId);
      }, 900);
    })();
  });
});
