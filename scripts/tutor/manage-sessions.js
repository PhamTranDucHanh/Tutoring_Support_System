// scripts/tutor/manage-sessions.js
// Quản lý, tìm kiếm, cập nhật và hủy buổi học cho một khóa học
document.addEventListener('DOMContentLoaded', () => {
  // Hiển thị kết quả buổi học ra bảng
  function displaySessionResults(sessions) {
    tableBody.innerHTML = '';
    if (sessions.length === 0) {
      msgEl.textContent = 'Không tìm thấy buổi học phù hợp.';
      msgEl.style.color = '#d9534f';
      return;
    }
    msgEl.textContent = '';
    sessions.forEach(sess => {
      tableBody.appendChild(formatSessionRow(sess));
    });
    attachRowHandlers();
  }
  const courseSelect = document.getElementById('manageCourseSelect');
  const searchInput = document.getElementById('searchSession');
  const tableBody = document.querySelector('#sessionsTable tbody');
  const msgEl = document.getElementById('manageMessage');

  const editModalEl = document.getElementById('editSessionModal');
  const editModal = new bootstrap.Modal(editModalEl);

  async function getCourses() {
    try {
      const resp = await fetch('/api/data/courses.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Không đọc được courses.json');
      return await resp.json();
    } catch (e) { return []; }
  }
  async function saveCourses(courses) {
    try {
      const resp = await fetch('/api/data/courses.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses)
      });
      return resp.ok;
    } catch (e) { return false; }
  }

  const params = new URLSearchParams(window.location.search);
  const urlCourseId = params.get('courseId');
  const addBtn = document.getElementById('addSessionBtn');

  async function populateCourseSelect() {
    const courses = await getCourses();
    courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    courses.forEach(c => {
      const o = document.createElement('option'); o.value = c.id; o.textContent = c.title || c.id; courseSelect.appendChild(o);
    });
    if (urlCourseId) { courseSelect.value = urlCourseId; courseSelect.disabled = true; }
    updateAddSessionLink();
  }

  function updateAddSessionLink(){
    const addBtn = document.getElementById('addSessionBtn');
    if (!addBtn) return;
    const cid = courseSelect.value;
    if (cid) addBtn.setAttribute('href', '/pages/tutor/create-session.html?courseId=' + encodeURIComponent(cid));
    else addBtn.setAttribute('href', '/pages/tutor/create-session.html');
  }

  function formatDateVN(dateStr) {
    // Chuyển yyyy-mm-dd hoặc ISO sang dd-mm-yyyy
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Nếu không phải ISO, thử tách thủ công
      const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return dateStr;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function formatSessionRow(session) {
    const tr = document.createElement('tr');
    const dateText = formatDateVN(session.date);
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

  async function renderSessions() {
    const courses = await getCourses();
    const courseId = courseSelect.value;
    if (!courseId) return;
    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.sessions)) return;
    const q = (searchInput.value || '').toLowerCase().trim();
    // Lọc theo từ khóa
    let filteredSessions = [...course.sessions];
    if (q) {
      filteredSessions = filteredSessions.filter(sess => (sess.topic||'').toLowerCase().includes(q));
    }
    // Loại bỏ trùng lặp theo tổ hợp chủ đề/ngày/giờ
    const seenCombo = new Set();
    filteredSessions = filteredSessions.filter(sess => {
      const combo = `${sess.topic}|${sess.date}|${sess.start}|${sess.end}`;
      if (seenCombo.has(combo)) return false;
      seenCombo.add(combo);
      return true;
    });
    // Sắp xếp theo ngày tăng dần
    function toISO(dateStr) {
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('-');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      return dateStr;
    }
    filteredSessions.sort((a, b) => new Date(toISO(a.date)) - new Date(toISO(b.date)));
    displaySessionResults(filteredSessions);
  }

  function attachRowHandlers(){
    tableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    tableBody.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => cancelSession(btn.dataset.id));
    });
  }

  async function openEditModal(sessionId){
    const courses = await getCourses();
    const course = courses.find(c => c.id === courseSelect.value);
    if (!course) return;
    const sess = (course.sessions || []).find(s => s.id === sessionId);
    if (!sess) return;
    document.getElementById('editSessionId').value = sess.id;
    document.getElementById('editTopic').value = sess.topic || '';
    document.getElementById('editDescription').value = sess.description || '';
    // Hiển thị ngày theo dd-mm-yyyy, nhưng input type="date" cần yyyy-mm-dd
    const dateInput = document.getElementById('editDate');
    if (sess.date) {
      // Nếu đã có ngày dạng dd-mm-yyyy thì chuyển về yyyy-mm-dd cho input
      let dval = sess.date;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dval)) {
        const [dd,mm,yyyy] = dval.split('-');
        dval = `${yyyy}-${mm}-${dd}`;
      }
      dateInput.value = dval;
    } else {
      dateInput.value = '';
    }
    document.getElementById('editStart').value = sess.start || '';
    document.getElementById('editEnd').value = sess.end || '';
    document.getElementById('editMode').value = sess.mode || 'Online';
    document.getElementById('editLocation').value = sess.location || '';
    editModal.show();
  }

  document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const sessId = document.getElementById('editSessionId').value;
    const topic = document.getElementById('editTopic').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const date = document.getElementById('editDate').value;
    const start = document.getElementById('editStart').value;
    const end = document.getElementById('editEnd').value;
    const mode = document.getElementById('editMode').value;
    const location = document.getElementById('editLocation').value.trim();

    if (!topic || !date || !start || !end) { alert('Vui lòng điền chủ đề, ngày và giờ.'); return; }

    const courses = await getCourses();
    const course = courses.find(c => c.id === courseSelect.value);
    if (!course) return;
    const sidx = (course.sessions || []).findIndex(s => s.id === sessId);
    if (sidx === -1) return;
    course.sessions[sidx] = Object.assign(course.sessions[sidx], { topic, description, date, start, end, mode, location });
    const saved = await saveCourses(courses);
    if (!saved) {
      showMessage('Lỗi khi lưu thay đổi!', 'error');
      return;
    }
    editModal.hide();
    showMessage('Cập nhật thành công', 'success');
    renderSessions();
  });

  // Modal xác nhận xóa
  const confirmModalEl = document.getElementById('confirmModal');
  const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
  let pendingDeleteSessionId = null;

  async function cancelSession(sessionId){
    pendingDeleteSessionId = sessionId;
    if (confirmModal) confirmModal.show();
  }

  // Xử lý nút xác nhận/hủy trong modal
  if (confirmModalEl) {
    document.getElementById('confirm-yes').addEventListener('click', async () => {
      if (!pendingDeleteSessionId) return;
      const courses = await getCourses();
      const course = courses.find(c => c.id === courseSelect.value);
      if (!course) return;
      course.sessions = (course.sessions || []).filter(s => s.id !== pendingDeleteSessionId);
      const saved = await saveCourses(courses);
      if (!saved) {
        showMessage('Lỗi khi hủy buổi học!', 'error');
        return;
      }
      showMessage('Đã hủy buổi học.', 'info');
      renderSessions();
      confirmModal.hide();
      pendingDeleteSessionId = null;
    });
    document.getElementById('confirm-no').addEventListener('click', () => {
      pendingDeleteSessionId = null;
      confirmModal.hide();
    });
  }

  function showMessage(text, type='info'){
    msgEl.textContent = text;
    msgEl.style.color = type==='error'? '#d9534f' : type==='success'? 'green' : '#333';
  }

  // events
  courseSelect.addEventListener('change', () => { renderSessions(); updateAddSessionLink(); });
  document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addSessionBtn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        const cid = courseSelect.value;
        if (!cid) {
          e.preventDefault();
          alert('Vui lòng chọn một khóa học trước khi tạo buổi mới.');
        }
      });
    }
  });
  searchInput.addEventListener('input', () => renderSessions());

  // init
  (async () => {
    await populateCourseSelect();
    // if course selected via query, render immediately
    if (courseSelect.value) renderSessions();
  })();
});
