
// scripts/student/calendar.js
document.addEventListener('DOMContentLoaded', function () {
	// DOM
	let calendarEl = document.getElementById('tutor-calendar');
	if (!calendarEl) {
		calendarEl = document.createElement('div');
		calendarEl.id = 'tutor-calendar';
		const box = document.querySelector('.calendar-box');
		box.appendChild(calendarEl);
	}

	// State
	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();
	let sessionsByDate = {};

	// Helper: format yyyy-mm-dd
	function formatDate(date) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	// Helper: lấy danh sách session mà tutor phụ trách
	async function loadTutorSessions() {
		let loggedInUser = null;
		try {
			loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
		} catch (e) {}
		if (!loggedInUser || !loggedInUser.username) return [];

		let tutors = [];
		try {
			const resp = await fetch('/api/data/tutor.json');
			tutors = await resp.json();
		} catch (err) { return []; }
		const tutor = tutors.find(t => t.username === loggedInUser.username);
		if (!tutor) return [];

		let courses = [];
		try {
			const resp = await fetch('/api/data/courses.json');
			courses = await resp.json();
		} catch (err) { return []; }

		let allSessions = [];
		// Lấy các course mà tutor phụ trách
		tutor.courses.forEach(tc => {
			const course = courses.find(c => c.id === tc.courseId);
			if (course && Array.isArray(course.sessions)) {
				course.sessions.forEach(sess => {
					// Sửa logic: lấy session mà tutor này phụ trách (có tutorId đúng),
					// hoặc session không có tutorId nhưng chỉ có một tutor phụ trách khóa đó (trường hợp session mới tạo)
					if (
						(sess.tutorId && sess.tutorId === tutor.id) ||
						(!sess.tutorId && Array.isArray(course.tutors) && course.tutors.length === 1 && course.tutors[0].id === tutor.id)
					) {
						allSessions.push({
							...sess,
							courseId: course.id,
							courseTitle: course.title
						});
					}
				});
			}
		});
		return allSessions;
	}

	// Popup chi tiết session
	function showSessionPopup(session) {
		// Xóa popup cũ
		document.querySelectorAll('.calendar-session-popup').forEach(e => e.remove());
		document.querySelectorAll('.calendar-session-popup-overlay').forEach(e => e.remove());
		// Tạo overlay nền đen
		const overlay = document.createElement('div');
		overlay.className = 'calendar-session-popup-overlay';
		document.body.appendChild(overlay);
		// Tạo popup
		const popup = document.createElement('div');
		popup.className = 'calendar-session-popup';
		popup.innerHTML = `
			<h5 style="font-weight:600;">${session.topic || 'Buổi học'}</h5>
			<div><b>Khóa học:</b> ${session.courseTitle || ''}</div>
			<div><b>Thời gian:</b> ${session.date || ''} ${session.start || ''} - ${session.end || ''}</div>
			<div><b>Địa điểm:</b> ${session.location || ''}</div>
			<div><b>Mô tả:</b> ${session.description || ''}</div>
			<button class="btn btn-secondary w-100" id="closeSessionPopup">Đóng</button>
		`;
		document.body.appendChild(popup);
		document.getElementById('closeSessionPopup').onclick = function () {
			popup.remove();
			overlay.remove();
		};
		overlay.onclick = function () {
			popup.remove();
			overlay.remove();
		};
	}

	// Helper: render lịch tháng
	function renderCalendar(month, year, sessionsByDate) {
		calendarEl.innerHTML = '';
		// Header
		const header = document.createElement('div');
		header.className = 'calendar-header d-flex align-items-center justify-content-between mb-2';
		header.innerHTML = `
			<button class="btn btn-sm btn-light" id="prevMonthBtn" title="Tháng trước"><i class="fas fa-chevron-left"></i></button>
			<span class="calendar-title" style="font-size:1.2rem;font-weight:500;">tháng ${month + 1} ${year}</span>
			<button class="btn btn-sm btn-light" id="nextMonthBtn" title="Tháng sau"><i class="fas fa-chevron-right"></i></button>
		`;
		calendarEl.appendChild(header);

		// Table calendar
		const table = document.createElement('table');
		table.className = 'table table-bordered calendar-table';
		const thead = document.createElement('thead');
		thead.innerHTML = `<tr>
			<th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>CN</th>
		</tr>`;
		table.appendChild(thead);

		const tbody = document.createElement('tbody');
		const firstDay = new Date(year, month, 1);
		const startDay = (firstDay.getDay() + 6) % 7;
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		let day = 1;
		for (let i = 0; i < 6; i++) {
			const tr = document.createElement('tr');
			for (let j = 0; j < 7; j++) {
				const td = document.createElement('td');
				td.style.height = '60px';
				td.style.verticalAlign = 'top';
				td.style.position = 'relative';
				if (i === 0 && j < startDay) {
					td.innerHTML = '';
				} else if (day > daysInMonth) {
					td.innerHTML = '';
				} else {
					// Hiệu ứng khoanh tròn ngày hôm nay
					const today = new Date();
					const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
					td.innerHTML = `<div style="font-weight:500;${isToday ? '' : ''}" class="${isToday ? 'calendar-today' : ''}">${day}</div>`;
					const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
					if (sessionsByDate[dateStr]) {
						sessionsByDate[dateStr].forEach((sess, idx) => {
							// Chấm đỏ nhỏ, dòng chữ nhỏ, không làm lệch layout
							const sessionRow = document.createElement('div');
							sessionRow.className = 'calendar-session-row';
							sessionRow.innerHTML = `<span class="calendar-session-dot"></span><span style="font-size:0.95em;white-space:nowrap;">${sess.topic ? sess.topic : 'Buổi học'}</span>`;
							sessionRow.onclick = function (e) {
								e.stopPropagation();
								showSessionPopup(sess);
							};
							td.appendChild(sessionRow);
						});
					}
					day++;
				}
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
			if (day > daysInMonth) break;
		}
		table.appendChild(tbody);
		calendarEl.appendChild(table);

		// Sự kiện chuyển tháng
		document.getElementById('prevMonthBtn').onclick = function () {
			if (currentMonth === 0) {
				currentMonth = 11;
				currentYear--;
			} else {
				currentMonth--;
			}
			renderCalendar(currentMonth, currentYear, sessionsByDate);
		};
		document.getElementById('nextMonthBtn').onclick = function () {
			if (currentMonth === 11) {
				currentMonth = 0;
				currentYear++;
			} else {
				currentMonth++;
			}
			renderCalendar(currentMonth, currentYear, sessionsByDate);
		};
	}

	// Main: load session và render lịch
	(async function () {
		const allSessions = await loadTutorSessions();
		sessionsByDate = {};
		allSessions.forEach(sess => {
			if (sess.date) {
				if (!sessionsByDate[sess.date]) sessionsByDate[sess.date] = [];
				sessionsByDate[sess.date].push(sess);
			}
		});
		renderCalendar(currentMonth, currentYear, sessionsByDate);
	})();
});
