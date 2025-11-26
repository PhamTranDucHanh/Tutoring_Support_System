// absence-request.js: handle absence request form submission
(function () {
    const studentNameEl = document.getElementById('ar-student-name');
    const studentIdEl = document.getElementById('ar-student-id');
    const sessionNameEl = document.getElementById('ar-session-name');
    const sessionDateEl = document.getElementById('ar-session-date');
    const sessionTimeEl = document.getElementById('ar-session-time');
    const reasonEl = document.getElementById('ar-reason');
    const backBtn = document.getElementById('ar-back');
    const submitBtn = document.getElementById('ar-submit');
    
    const finalConfirmModal = new bootstrap.Modal(document.getElementById('finalConfirmModal'));
    const finalConfirmYes = document.getElementById('final-confirm-yes');
    
    let selectedSession = null;
    let studentInfo = null;

    function loadData() {
        try {
            // Get selected session from sessionStorage
            const rawSession = sessionStorage.getItem('absenceRequestSession');
            if (!rawSession) {
                alert('Không tìm thấy thông tin buổi học. Quay lại trang trước.');
                goBack();
                return;
            }
            selectedSession = JSON.parse(rawSession);
            
            // Get student info from localStorage
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!loggedInUser) {
                alert('Không tìm thấy thông tin đăng nhập.');
                goBack();
                return;
            }
            
            // Populate form fields
            if (studentNameEl) studentNameEl.value = loggedInUser.fullName || '';
            if (studentIdEl) studentIdEl.value = loggedInUser.id || loggedInUser.username || '';
            if (sessionNameEl) sessionNameEl.value = selectedSession.topic || '';
            if (sessionDateEl) sessionDateEl.value = selectedSession.date || '';
            if (sessionTimeEl) {
                const timeStr = (selectedSession.start && selectedSession.end) 
                    ? `${selectedSession.start} - ${selectedSession.end}` 
                    : '';
                sessionTimeEl.value = timeStr;
            }
            
            // Focus on reason field
            if (reasonEl) reasonEl.focus();
            
        } catch (e) {
            console.error('Error loading absence request data:', e);
            alert('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
            goBack();
        }
    }

    function goBack() {
        // Clean up and go back to my-course
        sessionStorage.removeItem('absenceRequestSession');
        window.location.href = '/pages/student/my-course.html';
    }

    function validateForm() {
        const reason = reasonEl ? reasonEl.value.trim() : '';
        if (!reason) {
            alert('Vui lòng nhập lý do vắng mặt.');
            if (reasonEl) reasonEl.focus();
            return false;
        }
        if (reason.length < 10) {
            alert('Lý do vắng mặt phải có ít nhất 10 ký tự.');
            if (reasonEl) reasonEl.focus();
            return false;
        }
        return true;
    }

    function handleSubmit() {
        if (!validateForm()) return;
        
        // Show final confirmation modal
        finalConfirmModal.show();
    }

    async function processAbsenceRequest() {
        try {
            const courseId = selectedSession.courseId || sessionStorage.getItem('returnToCourseId');
            
            // First, get current courses data
            const coursesResponse = await fetch('/api/data/courses.json', { cache: 'no-store' });
            if (!coursesResponse.ok) {
                throw new Error('Cannot fetch courses data');
            }
            const courses = await coursesResponse.json();
            
            // Find and remove the session
            let sessionRemoved = false;
            courses.forEach(course => {
                if (course.id === courseId && course.sessions) {
                    const sessionIndex = course.sessions.findIndex(s => s.id === selectedSession.id);
                    if (sessionIndex >= 0) {
                        course.sessions.splice(sessionIndex, 1);
                        // Update numCurrentSessions
                        if (course.numCurrentSessions) {
                            course.numCurrentSessions = course.sessions.length;
                        }
                        sessionRemoved = true;
                    }
                }
            });
            
            if (!sessionRemoved) {
                throw new Error('Session not found in courses data');
            }
            
            // Save updated courses data
            const updateResponse = await fetch('/api/data/courses.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courses)
            });
            
            if (!updateResponse.ok) {
                throw new Error('Cannot update courses data');
            }
            
            // Create absence record for tracking
            const absenceData = {
                sessionId: selectedSession.id,
                courseId: courseId,
                studentId: studentIdEl ? studentIdEl.value : '',
                studentName: studentNameEl ? studentNameEl.value : '',
                sessionTopic: selectedSession.topic,
                sessionDate: selectedSession.date,
                sessionTime: `${selectedSession.start} - ${selectedSession.end}`,
                reason: reasonEl ? reasonEl.value.trim() : '',
                requestDate: new Date().toISOString(),
                status: 'approved'
            };
            
            console.log('Absence request processed:', absenceData);
            
            alert('Đơn xin vắng mặt đã được gửi thành công!\nBuổi học đã được hủy khỏi lịch của bạn.');
            
            // Clean up and return to my-course
            sessionStorage.removeItem('absenceRequestSession');
            window.location.href = '/pages/student/my-course.html';
            
        } catch (error) {
            console.error('Error processing absence request:', error);
            alert('Có lỗi khi xử lý đơn xin vắng: ' + error.message);
        }
    }

    function init() {
        loadData();
        
        // Event listeners
        if (backBtn) {
            backBtn.addEventListener('click', goBack);
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmit);
        }
        
        if (finalConfirmYes) {
            finalConfirmYes.addEventListener('click', () => {
                finalConfirmModal.hide();
                processAbsenceRequest();
            });
        }
        
        // Auto-resize textarea
        if (reasonEl) {
            reasonEl.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();