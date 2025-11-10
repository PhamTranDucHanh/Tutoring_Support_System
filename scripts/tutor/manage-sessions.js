// scripts/tutor/manage-sessions.js
// Quản lý, tìm kiếm, cập nhật và hủy buổi học cho một khóa học
document.addEventListener('DOMContentLoaded', () => {
  const courseSelect = document.getElementById('manageCourseSelect');
  const searchInput = document.getElementById('searchSession');
  const tableBody = document.querySelector('#sessionsTable tbody');
  const msgEl = document.getElementById('manageMessage');

  const editModalEl = document.getElementById('editSessionModal');
  const editModal = new bootstrap.Modal(editModalEl);

  function getCourses() {
    try { return JSON.parse(localStorage.getItem('courses') || '[]'); } catch (e) { return []; }
  }
  function saveCourses(c) { localStorage.setItem('courses', JSON.stringify(c)); }

  const params = new URLSearchParams(window.location.search);
  const urlCourseId = params.get('courseId');

  function populateCourseSelect() {
    const courses = getCourses();
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    courses.forEach(c => {
      const o = document.createElement('option'); o.value = c.id; o.textContent = c.title || c.id; courseSelect.appendChild(o);
    });
    if (urlCourseId) { courseSelect.value = urlCourseId; courseSelect.disabled = true; }
  }

  function formatSessionRow(session) {
    const tr = document.createElement('tr');
    const dateText = session.date || '';
    const timeText = (session.start ? session.start : '') + (session.end ? (' - ' + session.end) : '');

    // location rendering: if location is a URL show anchor with text 'link' (tutor provides only link),
    // otherwise show room/code text. Always escape values.
    let locationHtml = '<span class="text-muted">-</span>';
    if (session.location && session.location.trim()) {
      const loc = session.location.trim();
      if (/^https?:\/\//i.test(loc)) {
        // tutor provides only link -> show 'link' as anchor text
        locationHtml = `<a href="${escapeHtml(loc)}" target="_blank" rel="noopener noreferrer">link</a>`;
      } else {
        locationHtml = `<span class="text-muted">${escapeHtml(loc)}</span>`;
      }
    }

    tr.innerHTML = `
      <td>${escapeHtml(session.topic)}</td>
      <td>${escapeHtml(dateText)}</td>
      <td>${escapeHtml(timeText)}</td>
      <td>${escapeHtml(session.mode || '')}</td>
      <td>${locationHtml}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${session.id}">Cập nhật</button>
        <button class="btn btn-sm btn-outline-danger btn-cancel ms-2" data-id="${session.id}">Hủy bỏ</button>
      </td>`;
    return tr;
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

  function renderSessions() {
    tableBody.innerHTML = '';
    const courses = getCourses();
    const courseId = courseSelect.value;
    if (!courseId) return;
    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.sessions)) return;
    const q = (searchInput.value || '').toLowerCase().trim();
    course.sessions.forEach(sess => {
      if (q && (!(sess.topic||'').toLowerCase().includes(q))) return;
      tableBody.appendChild(formatSessionRow(sess));
    });
    attachRowHandlers();
  }

  function attachRowHandlers(){
    tableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    tableBody.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => cancelSession(btn.dataset.id));
    });
  }

  function openEditModal(sessionId){
    const courses = getCourses();
    const course = courses.find(c => c.id === courseSelect.value);
    if (!course) return;
    const sess = (course.sessions || []).find(s => s.id === sessionId);
    if (!sess) return;
    document.getElementById('editSessionId').value = sess.id;
    document.getElementById('editTopic').value = sess.topic || '';
    document.getElementById('editDescription').value = sess.description || '';
    document.getElementById('editDate').value = sess.date || '';
    document.getElementById('editStart').value = sess.start || '';
    document.getElementById('editEnd').value = sess.end || '';
    document.getElementById('editMode').value = sess.mode || 'Online';
    document.getElementById('editLocation').value = sess.location || '';
    editModal.show();
  }

  document.getElementById('saveEditBtn').addEventListener('click', () => {
    const sessId = document.getElementById('editSessionId').value;
    const topic = document.getElementById('editTopic').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const date = document.getElementById('editDate').value;
    const start = document.getElementById('editStart').value;
    const end = document.getElementById('editEnd').value;
    const mode = document.getElementById('editMode').value;
    const location = document.getElementById('editLocation').value.trim();

    if (!topic || !date || !start || !end) { alert('Vui lòng điền chủ đề, ngày và giờ.'); return; }

    const courses = getCourses();
    const course = courses.find(c => c.id === courseSelect.value);
    if (!course) return;
    const sidx = (course.sessions || []).findIndex(s => s.id === sessId);
    if (sidx === -1) return;
    course.sessions[sidx] = Object.assign(course.sessions[sidx], { topic, description, date, start, end, mode, location });
    saveCourses(courses);
    editModal.hide();
    showMessage('Cập nhật thành công', 'success');
    renderSessions();
  });

  function cancelSession(sessionId){
    if (!confirm('Bạn có chắc muốn hủy buổi học này?')) return;
    const courses = getCourses();
    const course = courses.find(c => c.id === courseSelect.value);
    if (!course) return;
    course.sessions = (course.sessions || []).filter(s => s.id !== sessionId);
    saveCourses(courses);
    showMessage('Đã hủy buổi học.', 'info');
    renderSessions();
  }

  function showMessage(text, type='info'){
    msgEl.textContent = text;
    msgEl.style.color = type==='error'? '#d9534f' : type==='success'? 'green' : '#333';
  }

  // events
  courseSelect.addEventListener('change', () => renderSessions());
  searchInput.addEventListener('input', () => renderSessions());

  // init
  populateCourseSelect();
  // if course selected via query, render immediately
  if (courseSelect.value) renderSessions();
});
