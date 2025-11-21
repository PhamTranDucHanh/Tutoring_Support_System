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
  // simple pastel palette for badges
  const palette = ['#f7c6c7','#a8c8ff','#ffb5a7','#c7f0d6','#f3e9a9'];
  courses.forEach((c, idx) => {
    const a = document.createElement('a');
    a.className = 'list-group-item list-group-item-action d-flex align-items-center course-item';
    a.href = '/pages/tutor/manage-sessions.html?courseId=' + encodeURIComponent(c.id);

    // color badge
    const badge = document.createElement('div');
    badge.className = 'course-badge';
    const color = palette[idx % palette.length];
    badge.style.backgroundColor = color;

    const content = document.createElement('div');
    content.className = 'ms-3 me-auto';
    const h = document.createElement('div'); h.className = 'fw-bold'; h.textContent = c.title || ('Khóa ' + c.id);
    const p = document.createElement('div'); p.className = 'small text-muted'; p.textContent = c.description ? (c.description.slice(0,120) + (c.description.length>120? '...':'')) : '';
    content.appendChild(h); content.appendChild(p);

    const right = document.createElement('div'); right.className = 'text-end small';
    const sessionsPerWeek = c.sessionsPerWeek || 0;
    right.innerHTML = `
      <div>${sessionsPerWeek} buổi/tuần</div>
      <div>${c.durationMonths||''} tháng</div>`;

    a.appendChild(badge);
    a.appendChild(content);
    a.appendChild(right);
    list.appendChild(a);
  });
});
