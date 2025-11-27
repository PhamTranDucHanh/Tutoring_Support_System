(function () {
  const sessionModalEl = document.getElementById('sessionModal');
  const sessionModalTitle = document.getElementById('sessionModalTitle');
  const sessionTableBody = document.getElementById('session-table-body');
  const sessionModal = (typeof bootstrap !== 'undefined' && sessionModalEl) ? new bootstrap.Modal(sessionModalEl) : null;

  // detail is handled in course-detail page now

  const confirmModalEl = document.getElementById('confirmModal');
  const confirmModal = (typeof bootstrap !== 'undefined' && confirmModalEl) ? new bootstrap.Modal(confirmModalEl) : null;
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  let dataCache = null;
  let currentCourseId = null;
  let currentCourseTitle = null;
  let pendingDeleteSession = null;
  let tutorsCache = null;

  async function loadTutors() {
    try {
      const resp = await fetch('/api/data/tutor.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('no tutor data');
      const json = await resp.json();
      // Convert array to map keyed by id
      const map = {};
      json.forEach(t => { map[t.id] = t; });
      return map;
    } catch (e) {
      // Fallback tutor data
      return {
        'TUT001': { id: 'TUT001', fullName: 'Lê Văn X' },
        'TUT002': { id: 'TUT002', fullName: 'Phạm Thị Y' },
        'TUT003': { id: 'TUT003', fullName: 'Trần Văn Z' }
      };
    }
  }

  async function loadData() {
    try {
      const resp = await fetch('/api/data/courses.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('no data');
      const json = await resp.json();
      if (!json || json.length === 0) throw new Error('empty');
      
      // Load tutors first to get names
      if (!tutorsCache) tutorsCache = await loadTutors();
      
      // Convert array to object keyed by id for compatibility
      const map = {};
      json.forEach(c => { 
        // Add tutor name from tutorsCache
        c.tutorName = (tutorsCache[c.tutorId] && tutorsCache[c.tutorId].fullName) || c.tutorId;
        map[c.id] = c; 
      });
      return map;
    } catch (e) {
      // Fallback data matching new courses.json structure (full data)
      return {
        "a_000": {
          id: "a_000",
          title: "Phương pháp học Giải tích 1",
          description: "Môn Giải tích 1 bao gồm các kiến thức cơ bản về vi tích phân hàm 1 biến và phương trình vi phân, cùng các ứng dụng.",
          tutorId: "TUT001",
          tutorName: "Lê Văn X",
          sessions: [
            { id: "a_001", topic: "Ôn tập đạo hàm cơ bản", description: "Ôn tập lại các dạng đạo hàm đã học ở lớp 12", date: "2025-12-01", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_002", topic: "Ứng dụng tích phân", description: "Bài tập ứng dụng tích phân trong kỹ thuật.", date: "2025-12-08", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_003", topic: "Bài tập đạo hàm nâng cao", description: "Luyện tập các bài toán đạo hàm kết hợp ứng dụng.", date: "2025-12-15", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_004", topic: "Ứng dụng tích phân (phần 2)", description: "Tiếp tục bài tập ứng dụng tích phân trong kỹ thuật.", date: "2025-12-22", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_005", topic: "Các kỹ thuật giải nhanh", description: "Phương pháp rút gọn và mẹo giải nhanh cho bài toán tích phân và đạo hàm.", date: "2025-12-29", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_006", topic: "Bài tập tổng hợp", description: "Tổng hợp và ôn luyện cho bài kiểm tra giữa kỳ.", date: "2026-01-05", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_007", topic: "Bài tập ôn cuối kỳ (phần 1)", description: "Ôn lại các kiến thức chính và làm bài tập mẫu.", date: "2026-01-12", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" },
            { id: "a_008", topic: "Bài tập ôn cuối kỳ (phần 2)", description: "Hoàn tất ôn tập và hướng dẫn tự học tiếp theo.", date: "2026-01-19", start: "09:00", end: "11:00", mode: "Offline", location: "H6-610" }
          ]
        },
        "b_000": {
          id: "b_000",
          title: "Kỹ năng thuyết trình",
          description: "Khóa học rèn luyện kỹ năng thuyết trình, trình bày slide, xử lý câu hỏi, và giao tiếp trước đám đông.",
          tutorId: "TUT002",
          tutorName: "Phạm Thị Y",
          sessions: [
            { id: "b_001", topic: "Kỹ thuật mở đầu và cấu trúc bài nói", description: "Cách mở đầu thu hút và cấu trúc bài trình bày.", date: "2025-12-01", start: "18:00", end: "20:00", mode: "Offline", location: "B3-210" },
            { id: "b_002", topic: "Thuyết trình kỹ thuật: Slide & Demo", description: "Thiết kế slide hiệu quả và demo thực hành.", date: "2025-12-08", start: "18:00", end: "20:00", mode: "Offline", location: "B3-210" },
            { id: "b_003", topic: "Thực hành trả lời câu hỏi", description: "Kỹ thuật xử lý câu hỏi hóc búa và phản xạ khi thuyết trình.", date: "2025-12-15", start: "18:00", end: "20:00", mode: "Offline", location: "B3-210" },
            { id: "b_004", topic: "Tổng hợp & phản biện", description: "Bài tập thực hành trước nhóm và phản biện.", date: "2025-12-22", start: "18:00", end: "20:00", mode: "Offline", location: "B3-210" }
          ]
        },
        "c_000": {
          id: "c_000",
          title: "Lập trình Python cơ bản",
          description: "Giới thiệu lập trình Python cho người mới bắt đầu: cú pháp, cấu trúc điều khiển, hàm, xử lý chuỗi.",
          tutorId: "TUT003",
          tutorName: "Lê Hoàng Nam",
          sessions: [
            { id: "c_001", topic: "Giới thiệu Python & môi trường phát triển", description: "Cài đặt Python, IDE, và viết chương trình đầu tiên.", date: "2025-12-01", start: "19:00", end: "21:00", mode: "Online", location: "https://meet.google.com/dir-rgxk-htj" },
            { id: "c_002", topic: "Cấu trúc dữ liệu cơ bản và hàm", description: "Danh sách, tuple, dict, set và cách viết hàm.", date: "2025-12-04", start: "19:00", end: "21:00", mode: "Online", location: "https://meet.google.com/dir-rgxk-htj" },
            { id: "c_003", topic: "Thực hành: Hàm và module", description: "Viết hàm, sử dụng module, tổ chức mã.", date: "2025-12-08", start: "19:00", end: "21:00", mode: "Online", location: "https://meet.google.com/dir-rgxk-htj" },
            { id: "c_004", topic: "Thực hành: Xử lý chuỗi và file", description: "Bài tập xử lý chuỗi, đọc/ghi file.", date: "2025-12-11", start: "19:00", end: "21:00", mode: "Online", location: "https://meet.google.com/dir-rgxk-htj" }
          ]
        }
      };
    }
  }

  // Helper function to map tutor IDs to names
  function getTutorName(tutorId) {
    const tutors = {
      'TUT001': 'Nguyễn Thị Xuân Anh',
      'TUT002': 'Trần Văn Minh',
      'TUT003': 'Lê Hoàng Nam'
    };
    return tutors[tutorId] || tutorId;
  }

  function clearTable() { if (sessionTableBody) sessionTableBody.innerHTML = ''; }

  function buildRow(session) {
    const tr = document.createElement('tr');
    // Format date and time from new structure: date (YYYY-MM-DD), start, end
    const dateStr = session.date || '';
    const timeStr = (session.start && session.end) ? `${session.start} - ${session.end}` : '';
    const tdDate = document.createElement('td'); tdDate.textContent = dateStr;
    const tdTopic = document.createElement('td'); tdTopic.textContent = session.topic || '';
    const tdTime = document.createElement('td'); tdTime.textContent = timeStr;
    const tdActions = document.createElement('td');
    const actions = document.createElement('div'); actions.className = 'session-actions';

    const btnDetail = document.createElement('button');
    btnDetail.className = 'btn btn-outline-primary btn-sm';
    btnDetail.textContent = 'Chi tiết';
    btnDetail.addEventListener('click', () => openDetail(session));

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-outline-danger btn-sm';
    btnCancel.textContent = 'Xin vắng';
    btnCancel.addEventListener('click', () => openAbsenceRequest(session));

    actions.appendChild(btnDetail); actions.appendChild(btnCancel); tdActions.appendChild(actions);
    tr.appendChild(tdDate); tr.appendChild(tdTopic); tr.appendChild(tdTime); tr.appendChild(tdActions);
    return tr;
  }

  function openList(title, sessions, courseId) {
    currentCourseId = courseId || currentCourseId;
    currentCourseTitle = title || currentCourseTitle;
    if (sessionModalTitle) sessionModalTitle.textContent = currentCourseTitle || 'Danh sách buổi học';
    clearTable();
    if (!sessions || sessions.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 4; td.textContent = 'Không có buổi học.'; tr.appendChild(td);
      sessionTableBody.appendChild(tr);
    } else {
      sessions.forEach(s => sessionTableBody.appendChild(buildRow(s)));
    }
    sessionModal && sessionModal.show();
  }

  function openDetail(session) {
    // Persist selection and navigation context, then go to dedicated detail page
    // Add tutor name to session for detail display
    const sessionWithTutor = { 
      ...session, 
      tutorName: (dataCache && currentCourseId && dataCache[currentCourseId]) 
        ? dataCache[currentCourseId].tutorName 
        : getTutorName(session.tutorId)
    };
    sessionStorage.setItem('selectedSession', JSON.stringify(sessionWithTutor));
    if (currentCourseId) sessionStorage.setItem('returnToCourseId', currentCourseId);
    if (currentCourseTitle) sessionStorage.setItem('returnToCourseTitle', currentCourseTitle);
    window.location.href = '/pages/student/course-detail.html';
  }

  function openAbsenceRequest(session) {
    // Navigate to absence request page with session data
    const sessionWithContext = {
      ...session,
      courseId: currentCourseId,
      courseTitle: currentCourseTitle,
      tutorName: (dataCache && currentCourseId && dataCache[currentCourseId]) 
        ? dataCache[currentCourseId].tutorName 
        : getTutorName(session.tutorId)
    };
    
    // Store session data for absence request page
    sessionStorage.setItem('absenceRequestSession', JSON.stringify(sessionWithContext));
    
    // Store return context for navigation back
    if (currentCourseId) sessionStorage.setItem('returnToCourseId', currentCourseId);
    if (currentCourseTitle) sessionStorage.setItem('returnToCourseTitle', currentCourseTitle);
    
    // Navigate to absence request page
    window.location.href = '/pages/student/absence-request.html';
  }

  function openConfirm(session) {
    // Simplified after removing inline detail modal: just ensure list modal is shown, then show confirm
    pendingDeleteSession = session;
    if (!sessionModalEl.classList.contains('show')) {
      sessionModal && sessionModal.show();
    }
    confirmModal && confirmModal.show();
  }

  function refreshAfterDelete() {
    const sessions = (dataCache && dataCache[currentCourseId] && dataCache[currentCourseId].sessions) || [];
    openList(currentCourseTitle, sessions, currentCourseId);
  }

  if (confirmYes) {
    confirmYes.addEventListener('click', async () => {
      confirmModal && confirmModal.hide();
      const handler = async () => {
        confirmModalEl.removeEventListener('hidden.bs.modal', handler);
        if (pendingDeleteSession && dataCache && currentCourseId) {
          // Remove session from local cache
          const arr = dataCache[currentCourseId].sessions || [];
          const idx = arr.indexOf(pendingDeleteSession);
          if (idx >= 0) {
            arr.splice(idx, 1);
            
            // Save changes to courses.json using API
            try {
              // Convert dataCache back to array format for courses.json
              const coursesArray = Object.values(dataCache);
              const response = await fetch('/api/data/courses.json', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(coursesArray)
              });
              
              if (!response.ok) {
                console.error('Lỗi khi lưu courses.json:', response.statusText);
                alert('Có lỗi khi lưu thay đổi. Vui lòng thử lại.');
                return;
              }
              
              console.log('Đã xóa session thành công và lưu vào courses.json');
            } catch (error) {
              console.error('Lỗi khi gọi API lưu courses.json:', error);
              alert('Có lỗi khi lưu thay đổi. Vui lòng thử lại.');
              return;
            }
          }
        }
        refreshAfterDelete();
        pendingDeleteSession = null;
      };
      confirmModalEl.addEventListener('hidden.bs.modal', handler);
    });
  }

  if (confirmNo) {
    confirmNo.addEventListener('click', () => {
      confirmModal && confirmModal.hide();
      const handler = () => {
        confirmModalEl.removeEventListener('hidden.bs.modal', handler);
        // Return to session list only
        sessionModal && sessionModal.show();
        pendingDeleteSession = null;
      };
      confirmModalEl.addEventListener('hidden.bs.modal', handler);
    });
  }

  // detail exit handled in course-detail page

  async function init() {
    // Lấy user hiện tại từ localStorage (object đầy đủ)
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || !loggedInUser.username) {
      console.error('Không tìm thấy thông tin user đăng nhập');
      return;
    }
    // Đọc stu.json qua API
    const respStu = await fetch('/api/data/stu.json', { cache: 'no-store' });
    if (!respStu.ok) {
      console.error('Không đọc được stu.json');
      return;
    }
    const students = await respStu.json();
    const student = students.find(s => s.username === loggedInUser.username);
    if (!student) {
      console.error('Không tìm thấy sinh viên với username:', loggedInUser.username);
      return;
    }
    if (!student.registeredCourses) {
      console.error('Sinh viên không có trường registeredCourses');
      return;
    }
    // Đọc courses.json qua API
    const respCourse = await fetch('/api/data/courses.json', { cache: 'no-store' });
    if (!respCourse.ok) {
      console.error('Không đọc được courses.json');
      return;
    }
    const courses = await respCourse.json();
    
    // Load tutors first to get names for detail display
    if (!tutorsCache) tutorsCache = await loadTutors();
    
    // Map courseId sang object course (chỉ lấy các course có id hợp lệ)
    const courseMap = {};
    courses.forEach(c => {
      if (c && c.id) {
        // Add tutor name from tutorsCache
        c.tutorName = (tutorsCache[c.tutorId] && tutorsCache[c.tutorId].fullName) || c.tutorId;
        courseMap[c.id] = c;
      }
    });
    
    // Set dataCache for openDetail function
    dataCache = courseMap;
    // Hiển thị danh sách các khóa học đã đăng ký
    const listGroup = document.querySelector('.list-group');
    if (listGroup) {
      listGroup.innerHTML = '';
      if (!student.registeredCourses || student.registeredCourses.length === 0) {
        listGroup.innerHTML = '<div class="list-group-item text-muted">Bạn chưa đăng ký khóa học nào.</div>';
      } else {
        let foundCourse = false;
        student.registeredCourses.forEach(rc => {
          if (!rc || !rc.courseId) return;
          const course = courseMap[rc.courseId];
          if (!course) {
            console.warn('Không tìm thấy khóa học với id:', rc.courseId);
            return;
          }
          foundCourse = true;
          const tutorNames = (course.tutors || []).map(t => t.name).join(', ');
          const item = document.createElement('a');
          item.href = '#';
          item.className = 'list-group-item list-group-item-action course-item';
          item.dataset.courseId = course.id;
          item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${course.title}</h5>
              <small>Gia sư: ${tutorNames}</small>
            </div>
            <p class="mb-1">${course.description}</p>
            <small>Đăng ký: ${new Date(rc.registeredAt).toLocaleString()} · Lịch học: ${course.sessionsPerWeek || '?'} buổi/tuần · Thời gian: ${course.durationMonths || '?'} tháng</small>
          `;
          listGroup.appendChild(item);
        });
        if (!foundCourse) {
          listGroup.innerHTML = '<div class="list-group-item text-danger">Không tìm thấy dữ liệu khóa học nào phù hợp!</div>';
        }
      }
    }
    // Gán sự kiện cho các item như cũ
    document.querySelectorAll('.course-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const id = item.getAttribute('data-course-id');
        const titleEl = item.querySelector('h5');
        const title = titleEl ? titleEl.textContent : (courseMap[id] && courseMap[id].title) || 'Danh sách buổi học';
        const sessions = (courseMap[id] && courseMap[id].sessions) || [];
        openList(title, sessions, id);
      });
    });
    // Nếu trở về từ trang chi tiết, tự động mở lại danh sách buổi học
    const backCourseId = sessionStorage.getItem('returnToCourseId');
    const backCourseTitle = sessionStorage.getItem('returnToCourseTitle');
    if (backCourseId) {
      const sessions = (courseMap[backCourseId] && courseMap[backCourseId].sessions) || [];
      openList(backCourseTitle || (courseMap[backCourseId] && courseMap[backCourseId].title) || 'Danh sách buổi học', sessions, backCourseId);
      sessionStorage.removeItem('returnToCourseId');
      sessionStorage.removeItem('returnToCourseTitle');
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
