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

    // THAY ĐỔI: Khởi tạo modal thành công
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const successModalCloseBtn = document.getElementById('success-modal-close');
    
    let selectedSession = null;

    function loadData() {
        try {
            const rawSession = sessionStorage.getItem('absenceRequestSession');
            if (!rawSession) {
                alert('Không tìm thấy thông tin buổi học. Quay lại trang trước.');
                goBack();
                return;
            }
            selectedSession = JSON.parse(rawSession);
            
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!loggedInUser) {
                alert('Không tìm thấy thông tin đăng nhập.');
                goBack();
                return;
            }
            
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
            
            if (reasonEl) reasonEl.focus();
            
        } catch (e) {
            console.error('Error loading absence request data:', e);
            alert('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
            goBack();
        }
    }

    function goBack() {
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
        finalConfirmModal.show();
    }

    // THAY ĐỔI: Logic xử lý đơn vắng mặt
    async function processAbsenceRequest() {
        try {
            const courseId = selectedSession.courseId || sessionStorage.getItem('returnToCourseId');
            
            // 1. Tạo đối tượng đơn xin vắng
            const absenceRecord = {
                id: `ar_${Date.now()}_${studentIdEl.value}`,
                sessionId: selectedSession.id,
                courseId: courseId,
                studentId: studentIdEl.value,
                studentName: studentNameEl.value,
                sessionTopic: selectedSession.topic,
                sessionDate: selectedSession.date,
                sessionTime: `${selectedSession.start} - ${selectedSession.end}`,
                reason: reasonEl.value.trim(),
                requestDate: new Date().toISOString(),
                status: 'pending' // Trạng thái chờ duyệt
            };

            // 2. Lấy danh sách đơn đã có
            let allRequests = [];
            try {
                const res = await fetch('/api/data/absence-requests.json');
                if (res.ok) {
                    allRequests = await res.json();
                }
            } catch (e) {
                // File có thể chưa tồn tại, bỏ qua lỗi và tiếp tục với mảng rỗng
            }

            // 3. Thêm đơn mới vào danh sách
            allRequests.push(absenceRecord);

            // 4. Gửi danh sách mới lên server để lưu
            const updateResponse = await fetch('/api/data/absence-requests.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allRequests, null, 2)
            });

            if (!updateResponse.ok) {
                throw new Error('Không thể lưu đơn xin vắng. Vui lòng thử lại.');
            }
            
            // 5. Hiển thị modal thành công
            successModal.show();

        } catch (error) {
            console.error('Error processing absence request:', error);
            alert('Có lỗi khi xử lý đơn xin vắng: ' + error.message);
        }
    }

    function init() {
        loadData();
        
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

        // THAY ĐỔI: Xử lý sự kiện đóng modal thành công
        if (successModalCloseBtn) {
            successModalCloseBtn.addEventListener('click', () => {
                successModal.hide();
                goBack(); // Quay về trang trước sau khi đóng modal
            });
        }
        
        if (reasonEl) {
            reasonEl.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();