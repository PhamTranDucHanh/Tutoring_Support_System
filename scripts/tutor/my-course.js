// scripts/tutor/my-course.js
// Hiển thị danh sách khóa học của tutor (lấy từ localStorage 'courses')
document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('coursesList');
  const msgEl = document.getElementById('myCourseMessage');
  const confirmEl = document.getElementById('confirmDeleteCourseModal');
  const confirmModal = confirmEl ? new bootstrap.Modal(confirmEl) : null;
  let pendingDeleteCourseId = null;

  // Lấy thông tin tutor hiện tại từ localStorage (object đầy đủ)
  const loggedInUser = (() => { try { return JSON.parse(localStorage.getItem('loggedInUser')); } catch(e){ return null; } })();
  const tutorId = loggedInUser && loggedInUser.id ? loggedInUser.id : null;

  async function getCoursesAPI(){
    const resp = await fetch('/api/data/courses.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('Không đọc được courses.json');
    return await resp.json();
  }
  async function saveCoursesAPI(courses){
    const resp = await fetch('/api/data/courses.json', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courses)
    });
    return resp.ok;
  }
  async function getTutorsAPI(){
    const resp = await fetch('/api/data/tutor.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('Không đọc được tutor.json');
    return await resp.json();
  }
  async function saveTutorsAPI(tutors){
    const resp = await fetch('/api/data/tutor.json', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tutors)
    });
    return resp.ok;
  }

  function showMessage(text, type='info'){
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = type==='error'? '#d9534f' : type==='success'? 'green' : '#333';
  }

  async function fetchCourses() {
    try {
      const allCourses = await getCoursesAPI();
      // Lọc các khóa học mà tutor này có trong tutors array
      const myCourses = allCourses.filter(course => Array.isArray(course.tutors) && course.tutors.some(t => t.id === tutorId));

      if (!myCourses.length) {
        list.innerHTML = '<div class="alert alert-info">Bạn chưa có khóa học nào. Nhấn "Tạo khóa học mới" để bắt đầu.</div>';
        return;
      }

      list.innerHTML = '';
      const palette = ['#f7c6c7','#a8c8ff','#ffb5a7','#c7f0d6','#f3e9a9'];
      myCourses.forEach((c, idx) => {
        // Wrapper item
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex align-items-center justify-content-between course-item';

        // Left clickable area -> anchor to manage sessions
        const a = document.createElement('a');
        a.className = 'd-flex align-items-center text-decoration-none flex-grow-1 me-3';
        a.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(c.id);

        const badge = document.createElement('div');
        badge.className = 'course-badge';
        const color = palette[idx % palette.length];
        badge.style.backgroundColor = color;

        const content = document.createElement('div');
        content.className = 'ms-3 me-auto';
        const h = document.createElement('div'); h.className = 'fw-bold'; h.textContent = c.title || ('Khóa ' + c.id);
        const p = document.createElement('div'); p.className = 'small text-muted'; p.textContent = c.description ? (c.description.slice(0,120) + (c.description.length>120? '...':'')) : '';
        content.appendChild(h); content.appendChild(p);

        // Thông tin số buổi/tuần và số tháng ngay dưới mô tả
        const info = document.createElement('div');
        info.className = 'small text-secondary mt-1';
        const sessionsPerWeek = c.sessionsPerWeek || 0;
        const durationMonths = c.durationMonths || '';
        info.textContent = `${sessionsPerWeek} buổi/tuần, ${durationMonths} tháng`;
        content.appendChild(info);

        a.appendChild(badge);
        a.appendChild(content);

        // Update button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-primary btn-sm ms-2';
        editBtn.textContent = 'Cập nhật';
        editBtn.setAttribute('data-course-id', c.id);
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openEditCourseModal(c);
        });

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-outline-danger btn-sm ms-2';
        delBtn.textContent = 'Xóa';
        delBtn.setAttribute('data-course-id', c.id);
        delBtn.addEventListener('click', (e) => {
          e.preventDefault();
          pendingDeleteCourseId = c.id;
          if (confirmModal) confirmModal.show();
        });

        item.appendChild(a);
        item.appendChild(editBtn);
        item.appendChild(delBtn);
        list.appendChild(item);
      });
  // Modal cập nhật khóa học
  function openEditCourseModal(course) {
  document.getElementById('editCourseId').value = course.id;
  document.getElementById('editCourseTitle').value = course.title || '';
  document.getElementById('editCourseDescription').value = course.description || '';
  document.getElementById('editSessionsPerWeek').value = course.sessionsPerWeek || '';
  document.getElementById('editDurationMonths').value = course.durationMonths || '';
  document.getElementById('editNumStudents').value = course.numCurrentStudents || 0;
  const editModalEl = document.getElementById('editCourseModal');
  const editModal = new bootstrap.Modal(editModalEl);
  editModal.show();
  }

  document.getElementById('saveEditCourseBtn').addEventListener('click', async () => {
    const id = document.getElementById('editCourseId').value;
    const title = document.getElementById('editCourseTitle').value.trim();
    const description = document.getElementById('editCourseDescription').value.trim();
    const sessionsPerWeek = parseInt(document.getElementById('editSessionsPerWeek').value, 10);
    const durationMonths = parseInt(document.getElementById('editDurationMonths').value, 10);
    const numStudents = parseInt(document.getElementById('editNumStudents').value, 10);
    if (!title || !sessionsPerWeek || !durationMonths || isNaN(numStudents)) {
      showMessage('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }
    try {
      const allCourses = await getCoursesAPI();
      const idx = allCourses.findIndex(c => c.id === id);
      if (idx === -1) {
        showMessage('Không tìm thấy khóa học.', 'error');
        return;
      }
      allCourses[idx].title = title;
      allCourses[idx].description = description;
      allCourses[idx].sessionsPerWeek = sessionsPerWeek;
      allCourses[idx].durationMonths = durationMonths;
      allCourses[idx].numCurrentStudents = numStudents;
      const saved = await saveCoursesAPI(allCourses);
      if (!saved) {
        showMessage('Lỗi khi lưu thay đổi!', 'error');
        return;
      }
      showMessage('Cập nhật thành công.', 'success');
      const editModalEl = document.getElementById('editCourseModal');
      const editModal = new bootstrap.Modal(editModalEl);
      editModal.hide();
      await fetchCourses();
    } catch (e) {
      showMessage('Lỗi khi cập nhật.', 'error');
    }
  });

  // Đảm bảo nút Hủy và dấu X đều đóng modal
  document.getElementById('cancelEditCourseBtn').addEventListener('click', () => {
    const editModalEl = document.getElementById('editCourseModal');
    const editModal = new bootstrap.Modal(editModalEl);
    editModal.hide();
  });
  document.getElementById('closeEditCourseModal').addEventListener('click', () => {
    const editModalEl = document.getElementById('editCourseModal');
    const editModal = new bootstrap.Modal(editModalEl);
    editModal.hide();
  });
    } catch (e) {
      list.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách khóa học.</div>';
    }
  }

  async function deleteCourse(courseId){
    try {
      // Xóa khỏi courses.json
      const all = await getCoursesAPI();
      const filtered = all.filter(c => c.id !== courseId);
      const saved = await saveCoursesAPI(filtered);
      if (!saved) throw new Error('Lưu courses.json thất bại');

      // Xóa mapping trong tutor.json
      try {
        const tutors = await getTutorsAPI();
        const idx = tutors.findIndex(t => t.id === tutorId);
        if (idx !== -1) {
          const arr = Array.isArray(tutors[idx].courses) ? tutors[idx].courses : [];
          tutors[idx].courses = arr.filter(x => x.courseId !== courseId);
          await saveTutorsAPI(tutors);
        }
      } catch (_) { /* optional, ignore */ }

      showMessage('Đã xóa khóa học.', 'success');
      await fetchCourses();
    } catch (err) {
      console.error(err);
      showMessage('Không thể xóa khóa học. Thử lại sau.', 'error');
    }
  }

  if (confirmEl) {
    document.getElementById('confirmDeleteYes').addEventListener('click', async () => {
      if (!pendingDeleteCourseId) return;
      await deleteCourse(pendingDeleteCourseId);
      pendingDeleteCourseId = null;
      confirmModal.hide();
    });
    document.getElementById('confirmDeleteNo').addEventListener('click', () => {
      pendingDeleteCourseId = null;
      confirmModal.hide();
    });
  }

  fetchCourses();
});
