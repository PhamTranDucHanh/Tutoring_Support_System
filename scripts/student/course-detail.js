// course-detail.js: populate detail from sessionStorage and navigate back preserving course list state
(function () {
	const lecturerEl = document.getElementById('cd-lecturer');
	const topicEl = document.getElementById('cd-topic');
	const descEl = document.getElementById('cd-desc');
	const formatEl = document.getElementById('cd-format');
	const roomEl = document.getElementById('cd-room');
	const exitBtn = document.getElementById('cd-exit');

	/**
	 * Fetches all tutors from the API.
	 * @returns {Promise<any>}
	 */
	function getTutorsAPI() {
		return fetch('/api/data/tutor.json').then((res) => {
			if (!res.ok) throw new Error('Failed to fetch tutors');
			return res.json();
		});
	}

	async function loadSession() {
		try {
			const raw = sessionStorage.getItem('selectedSession');
			if (!raw) return;
			const s = JSON.parse(raw);

			// Fetch tutors to find the tutor's name
			const tutors = await getTutorsAPI();
			const tutor = tutors.find((t) => t.id === s.tutorId);
			const tutorName = tutor ? tutor.fullName : s.tutorId || '';

			// Populate fields with session data
			if (lecturerEl) lecturerEl.value = tutorName;
			if (topicEl) topicEl.value = s.topic || '';
			if (descEl) descEl.value = s.description || s.desc || '';
			if (formatEl) formatEl.value = s.mode || s.format || '';
			if (roomEl) roomEl.value = s.location || s.room || s.link || '';
		} catch (e) {
			console.error('Error loading session:', e);
			// ignore parse errors
		}
	}
	function exit() {
		// Keep returnToCourseId / Title so my-course can re-open list
		sessionStorage.removeItem('selectedSession');
		window.location.href = '/pages/student/my-course.html';
	}

	function init() {
		loadSession();
		if (exitBtn) exitBtn.addEventListener('click', exit);
	}

	document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
