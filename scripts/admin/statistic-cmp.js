document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const tabName = this.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        this.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
    });
});

// Upload area
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
let selectedFiles = [];

uploadArea.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        fileInput.click();
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    selectedFiles = Array.from(files);
    displayFiles();
    uploadBtn.disabled = selectedFiles.length === 0;
}

function displayFiles() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
                    <div class="file-info">
                        <div class="file-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div>
                            <div class="fw-semibold">${file.name}</div>
                            <small class="text-muted">${(file.size / 1024).toFixed(2)} KB</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFiles();
    uploadBtn.disabled = selectedFiles.length === 0;
}

function uploadFiles() {
    if (selectedFiles.length > 0) {
        alert('Đang xử lý ' + selectedFiles.length + ' file...');
        // Chuyển sang tab kết quả
        document.querySelector('[data-tab="result"]').click();
    }
}

function performCompare() {
    const obj1 = document.getElementById('object1').value;
    const obj2 = document.getElementById('object2').value;

    if (!obj1 || !obj2) {
        alert('Vui lòng chọn đủ 2 đối tượng để so sánh!');
        return;
    }

    // Cập nhật header
    document.getElementById('header1').textContent = obj1;
    document.getElementById('header2').textContent = obj2;

    // Chuyển sang tab kết quả
    document.querySelector('[data-tab="result"]').click();
}