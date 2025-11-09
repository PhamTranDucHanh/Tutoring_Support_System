// JS for My Course page: open a session list modal when a course is clicked
(function () {
	// session list modal (Bootstrap)
	const sessionModalEl = document.getElementById('sessionModal');
	const sessionModalTitle = document.getElementById('sessionModalTitle');
	const sessionTableBody = document.getElementById('session-table-body');
	const sessionBootstrapModal = (typeof bootstrap !== 'undefined' && sessionModalEl) ? new bootstrap.Modal(sessionModalEl) : null;

	// session detail modal (Bootstrap)
	const detailModalEl = document.getElementById('sessionDetailModal');
	const detailBootstrapModal = (typeof bootstrap !== 'undefined' && detailModalEl) ? new bootstrap.Modal(detailModalEl) : null;
	const inputLecturer = document.getElementById('detail-lecturer');
	const inputTopic = document.getElementById('detail-topic');
	const inputDesc = document.getElementById('detail-desc');
	const inputFormat = document.getElementById('detail-format');
	const inputRoom = document.getElementById('detail-room');
	const detailExitBtn = document.getElementById('detail-exit-btn');

		// Try to fetch course/session data from /data/courses.json.
	// If that fails or returns nothing, use a fallback demo dataset.
	async function loadCoursesData() {
		try {
			const resp = await fetch('/data/courses.json', { cache: 'no-store' });
			if (!resp.ok) throw new Error('no data');
			const json = await resp.json();
			// if file empty or no keys, treat as empty
			if (!json || Object.keys(json).length === 0) throw new Error('empty');
			return json;
		} catch (err) {
			// fallback demo
			return {
				"course-1": {
					"title": "Khóa học: Nhập môn C++",
					"sessions": [
						{ "date": "05/12/2025", "weekday": "Thứ Sáu", "topic": "Chủ đề 1", "time": "9:00 - 11:00", "lecturer": "Nguyễn Thị Xuân Anh", "description": "Buổi học giúp sinh viên ôn tập lại toàn bộ kiến thức liên quan đến đạo hàm cơ bản.", "format": "Offline", "room": "H6-610" },
						{ "date": "12/12/2025", "weekday": "Thứ Sáu", "topic": "Chủ đề 2", "time": "08:00 - 11:00", "lecturer": "Nguyễn Thị Xuân Anh", "description": "Bàn luận các bài tập vận dụng đạo hàm trong bài toán tối ưu.", "format": "Online", "room": "https://meet.example.com/abc123" },
						{ "date": "17/12/2025", "weekday": "Thứ Tư", "topic": "Chủ đề 3", "time": "13:00 - 15:00", "lecturer": "Nguyễn Thị Xuân Anh", "description": "Thực hành vẽ đồ thị và phân tích tính liên tục, đạo hàm.", "format": "Offline", "room": "H6-610" },
						{ "date": "24/12/2025", "weekday": "Thứ Tư", "topic": "Chủ đề 4", "time": "17:00 - 19:00", "lecturer": "Nguyễn Thị Xuân Anh", "description": "Tổng kết và giải đáp thắc mắc trước kỳ kiểm tra giữa kỳ.", "format": "Offline", "room": "H6-610" }
					]
				},
				"course-2": {
					"title": "Khóa học: STM32 cho người mới",
					"sessions": [
						{ "date": "02/12/2025", "weekday": "Thứ Ba", "topic": "Giới thiệu", "time": "9:00 - 11:00", "lecturer": "Trần Thị B", "description": "Giới thiệu nền tảng STM32 và môi trường phát triển.", "format": "Offline", "room": "A2-101" },
						{ "date": "09/12/2025", "weekday": "Thứ Ba", "topic": "Cơ bản", "time": "9:00 - 11:00", "lecturer": "Trần Thị B", "description": "Lập trình GPIO và đọc cảm biến cơ bản.", "format": "Online", "room": "https://meet.example.com/stm32" }
					]
				},
				"course-3": {
					"title": "Arduino nâng cao",
					"sessions": [
						{ "date": "06/12/2025", "weekday": "Thứ Bảy", "topic": "Cảm biến", "time": "14:00 - 16:00", "lecturer": "Lê Văn C", "description": "Ứng dụng cảm biến analog và digital trong dự án thực tế.", "format": "Offline", "room": "H3-202" },
						{ "date": "13/12/2025", "weekday": "Thứ Bảy", "topic": "Giao tiếp", "time": "14:00 - 16:00", "lecturer": "Lê Văn C", "description": "Giao tiếp SPI/I2C và điều khiển thiết bị ngoại vi.", "format": "Offline", "room": "H3-202" }
					]
				}
			};
		}
	}

		// in-memory data reference (set in init)
		let coursesData = null;
		let currentCourseId = null;
		let currentCourseTitle = null;

		function clearTable() {
			if (sessionTableBody) sessionTableBody.innerHTML = '';
		}

			// confirmation modal (available globally in this module)
			const confirmModalEl = document.getElementById('confirmModal');
			const confirmBootstrapModal = (typeof bootstrap !== 'undefined' && confirmModalEl) ? new bootstrap.Modal(confirmModalEl) : null;
			const confirmYes = document.getElementById('confirm-yes');
			const confirmNo = document.getElementById('confirm-no');
			let pendingDelete = null; // {session, tr}

			function showConfirmFor(session, tr) {
					pendingDelete = { session, tr };
					// Ensure confirm modal appears above the session list modal.
					// If detail modal is open, hide it first. Then show session list modal (if not shown),
					// and finally show the confirm modal.
					const detailIsShown = detailModalEl && detailModalEl.classList.contains('show');
					const sessionIsShown = sessionModalEl && sessionModalEl.classList.contains('show');

					if (detailIsShown && detailBootstrapModal) {
						// hide detail first, then show session list and confirm
						detailBootstrapModal.hide();
						const onHidden = function () {
							detailModalEl.removeEventListener('hidden.bs.modal', onHidden);
							if (sessionBootstrapModal && !sessionIsShown) sessionBootstrapModal.show();
							if (confirmBootstrapModal) confirmBootstrapModal.show();
						};
						detailModalEl.addEventListener('hidden.bs.modal', onHidden);
					} else {
						if (sessionBootstrapModal && !sessionIsShown) sessionBootstrapModal.show();
						if (confirmBootstrapModal) confirmBootstrapModal.show();
					}
			}

				// wire confirm button handlers (module-scope handlers)
				if (confirmYes) {
					confirmYes.addEventListener('click', () => {
						if (!pendingDelete) return;
						// remove from in-memory data
						if (coursesData && currentCourseId && coursesData[currentCourseId]) {
							const arr = coursesData[currentCourseId].sessions || [];
							const idx = arr.findIndex(s => s === pendingDelete.session);
							if (idx >= 0) arr.splice(idx, 1);
						}
						// hide confirm, then refresh session modal
						if (confirmBootstrapModal) confirmBootstrapModal.hide();
						if (confirmModalEl) {
							const handler = function () {
								confirmModalEl.removeEventListener('hidden.bs.modal', handler);
								// refresh session list for the current course
								openModal(currentCourseTitle, (coursesData && coursesData[currentCourseId] && coursesData[currentCourseId].sessions) || [], currentCourseId);
							};
							confirmModalEl.addEventListener('hidden.bs.modal', handler);
						}
						pendingDelete = null;
					});
				}

				if (confirmNo) {
					confirmNo.addEventListener('click', () => {
						if (!pendingDelete) return;
						if (confirmBootstrapModal) confirmBootstrapModal.hide();
						if (confirmModalEl) {
							const handler = function () {
								confirmModalEl.removeEventListener('hidden.bs.modal', handler);
								// On cancel, return to the session list (not the detail view).
								if (sessionBootstrapModal) {
									// ensure the session list is visible
									sessionBootstrapModal.show();
								}
								pendingDelete = null;
							};
							confirmModalEl.addEventListener('hidden.bs.modal', handler);
						}
					});
				}

	function createRow(session) {
		const tr = document.createElement('tr');

		const tdDate = document.createElement('td');
		tdDate.textContent = `${session.weekday || ''} (${session.date || ''})`;

		const tdTopic = document.createElement('td');
		tdTopic.textContent = session.topic || '';

		const tdTime = document.createElement('td');
		tdTime.textContent = session.time || '';

		const tdActions = document.createElement('td');
		const actions = document.createElement('div');
		actions.className = 'session-actions';

		const btnDetail = document.createElement('button');
		btnDetail.className = 'btn btn-outline-primary btn-sm';
		btnDetail.textContent = 'Chi tiết';
		btnDetail.addEventListener('click', (e) => {
			e.stopPropagation();
			openDetailModal(session);
		});

			const btnCancel = document.createElement('button');
			btnCancel.className = 'btn btn-outline-danger btn-sm';
			btnCancel.textContent = 'Hủy';
			btnCancel.addEventListener('click', (e) => {
				e.stopPropagation();
				// show confirmation modal instead of browser confirm
				showConfirmFor(session, tr);
			});

		actions.appendChild(btnDetail);
		actions.appendChild(btnCancel);
		tdActions.appendChild(actions);

		tr.appendChild(tdDate);
		tr.appendChild(tdTopic);
		tr.appendChild(tdTime);
		tr.appendChild(tdActions);
		return tr;
	}

		function openModal(title, sessions, courseId) {
			// remember current course for delete operations
			currentCourseId = courseId || currentCourseId;
			currentCourseTitle = title || currentCourseTitle;
			if (sessionModalTitle) sessionModalTitle.textContent = currentCourseTitle || 'Danh sách buổi học';
			clearTable();
			if (!sessions || sessions.length === 0) {
				const tr = document.createElement('tr');
				const td = document.createElement('td');
				td.colSpan = 4;
				td.textContent = 'Không có buổi học.';
				tr.appendChild(td);
				if (sessionTableBody) sessionTableBody.appendChild(tr);
			} else {
				sessions.forEach(s => {
					if (sessionTableBody) sessionTableBody.appendChild(createRow(s));
				});
			}
			if (sessionBootstrapModal) sessionBootstrapModal.show();
		}

	function closeModal() {
		if (sessionBootstrapModal) sessionBootstrapModal.hide();
		clearTable();
	}

	function openDetailModal(session) {
		if (inputLecturer) inputLecturer.value = session.lecturer || '';
		if (inputTopic) inputTopic.value = session.topic || '';
		if (inputDesc) inputDesc.value = session.description || session.desc || '';
		if (inputFormat) inputFormat.value = session.format || session.mode || '';
		if (inputRoom) inputRoom.value = session.room || session.link || '';

		if (sessionBootstrapModal) sessionBootstrapModal.hide();
		if (detailBootstrapModal) detailBootstrapModal.show();
	}

	function closeDetailModal() {
		if (detailBootstrapModal) detailBootstrapModal.hide();
		if (inputLecturer) inputLecturer.value = '';
		if (inputTopic) inputTopic.value = '';
		if (inputDesc) inputDesc.value = '';
		if (inputFormat) inputFormat.value = '';
		if (inputRoom) inputRoom.value = '';
	}

	async function init() {
			const data = await loadCoursesData();
			// store in-memory reference so deletes persist while page open
			coursesData = data;
		const items = document.querySelectorAll('.course-item');
		items.forEach(item => {
			item.addEventListener('click', async function (e) {
				e.preventDefault();
				const id = this.getAttribute('data-course-id');
				const titleEl = this.querySelector('h5');
				const title = titleEl ? titleEl.textContent : (data[id] && data[id].title) || 'Danh sách buổi học';
				const sessions = (data && data[id] && data[id].sessions) || [];
					openModal(title, sessions, id);
			});
		});

		// When exiting detail modal via THOÁT button, return to session list (not course list)
		if (detailExitBtn && detailBootstrapModal) {
			detailExitBtn.addEventListener('click', () => {
				// Wait until detail modal fully hidden, then reopen session list modal if we still have a current course
				const handler = function () {
					detailModalEl.removeEventListener('hidden.bs.modal', handler);
					if (currentCourseId && sessionBootstrapModal) {
						sessionBootstrapModal.show();
					}
				};
				detailModalEl.addEventListener('hidden.bs.modal', handler);
			});
		}

				// confirmation modal handlers are declared at module scope
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
