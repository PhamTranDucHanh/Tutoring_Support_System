// course-detail.js: populate detail from sessionStorage and navigate back preserving course list state
(function () {
	const lecturerEl = document.getElementById('cd-lecturer');
	const topicEl = document.getElementById('cd-topic');
	const descEl = document.getElementById('cd-desc');
	const formatEl = document.getElementById('cd-format');
	const roomEl = document.getElementById('cd-room');
	const exitBtn = document.getElementById('cd-exit');

  function loadSession() {
    try {
      const raw = sessionStorage.getItem('selectedSession');
      if (!raw) return;
      const s = JSON.parse(raw);
      
      // Tutor name is already included in session object from my-course.js
      const tutorName = s.tutorName || s.tutorId || '';
      
      // Populate fields with session data
      if (lecturerEl) lecturerEl.value = tutorName;
      if (topicEl) topicEl.value = s.topic || '';
      if (descEl) descEl.value = s.description || s.desc || '';
      if (formatEl) formatEl.value = s.mode || s.format || '';
      if (roomEl) roomEl.value = s.location || s.room || s.link || '';
    } catch (e) {
      // ignore parse errors
    }
  }	function exit() {
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
