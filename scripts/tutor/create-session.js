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

  function getCourses() {
    try {
      return JSON.parse(localStorage.getItem('courses') || '[]');
    } catch (e) { return []; }
  }
  function saveCourses(c) { localStorage.setItem('courses', JSON.stringify(c)); }

  // --- ID generator for sessions following scheme: <letter>_001, <letter>_002, ...
  function generateSessionIdForCourse(courseId) {
    // courseId expected like 'a_000' -> letter = 'a'
    const m = (courseId || '').match(/^([a-zA-Z])_\d{3}$/);
    const letter = m ? m[1].toLowerCase() : 'x';
    const courses = getCourses();
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
    const courses = getCourses();
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
    renderSchedules();
    chooseModal.hide();
  });

  form.addEventListener('submit', (ev) => {
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
    const courses = getCourses();
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx === -1) { sessionMsg.textContent = 'Không tìm thấy khóa học.'; return; }

    // create sessions for each chosen schedule (use deterministic ids per course)
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

    saveCourses(courses);
    sessionMsg.style.color = 'green';
    sessionMsg.textContent = 'Tạo buổi học thành công.';
    // redirect to manage-sessions for this course
    setTimeout(() => {
      window.location.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(courseId);
    }, 900);
  });
});
