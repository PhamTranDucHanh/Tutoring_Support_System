// scripts/tutor/my-course.js
// Hiển thị danh sách khóa học của tutor (lấy từ localStorage 'courses')
document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('coursesList');
  function getCourses(){ try { return JSON.parse(localStorage.getItem('courses') || '[]'); } catch(e){ return []; } }
  const user = (() => { try { return JSON.parse(localStorage.getItem('currentUser')); } catch(e){ return null; } })();

  const tutorId = user && user.id ? user.id : null;
  const courses = getCourses().filter(c => (tutorId ? c.tutorId === tutorId : true));

  if (!courses.length) {
    list.innerHTML = '<div class="alert alert-info">Bạn chưa có khóa học nào. Nhấn "Tạo khóa học mới" để bắt đầu.</div>';
    return;
  }

  list.innerHTML = '';
  courses.forEach(c => {
    const a = document.createElement('a');
    a.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-start';
    a.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(c.id);
    const left = document.createElement('div');
    left.className = 'ms-2 me-auto';
    const h = document.createElement('div'); h.className = 'fw-bold'; h.textContent = c.title || ('Khóa ' + c.id);
    const p = document.createElement('div'); p.className = 'small text-muted'; p.textContent = c.description ? (c.description.slice(0,120) + (c.description.length>120? '...':'')) : '';
    left.appendChild(h); left.appendChild(p);
    const right = document.createElement('div'); right.className = 'text-end small';
    const sessionsCount = (c.sessions && c.sessions.length) ? c.sessions.length : 0;
    right.innerHTML = `<div>${sessionsCount} buổi/Tuần</div> <div>${c.durationMonths||''} tháng</div>`;
    a.appendChild(left); a.appendChild(right);
    list.appendChild(a);
  });
});
