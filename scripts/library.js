// scripts/library.js

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsBox = document.getElementById('results-box');
    const documentList = document.getElementById('document-list');
    const noResultsMessage = document.getElementById('no-results-message');
    const paginationContainer = document.getElementById('pagination-container');

    let allDocuments = []; // Biến để lưu trữ tất cả tài liệu

    // 1. Tải dữ liệu từ file JSON ngay khi trang được tải
    fetch('/data/document.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải file document.json');
            }
            return response.json();
        })
        .then(data => {
            allDocuments = data; // Lưu dữ liệu vào biến
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu:', error);
            documentList.innerHTML = '<p class="text-danger text-center">Không thể tải được danh sách tài liệu.</p>';
        });

    // 2. Lắng nghe sự kiện "submit" trên form tìm kiếm
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Ngăn trang tải lại khi nhấn Enter
        
        const query = searchInput.value.trim().toLowerCase(); // Lấy từ khóa, xóa khoảng trắng, chuyển thành chữ thường

        if (query) {
            // Nếu có từ khóa, thực hiện tìm kiếm
            const filteredDocuments = allDocuments.filter(doc => 
                doc.ten_tai_lieu.toLowerCase().includes(query)
            );
            displayResults(filteredDocuments);
        } else {
            // Nếu ô tìm kiếm trống, ẩn kết quả
            resultsBox.classList.add('d-none');
            paginationContainer.style.display = 'none';
        }
    });

    /**
     * 3. Hàm hiển thị kết quả tìm kiếm ra giao diện
     * @param {Array} documents - Mảng các tài liệu đã được lọc
     */
    function displayResults(documents) {
        documentList.innerHTML = ''; // Xóa kết quả cũ
        resultsBox.classList.remove('d-none'); // Hiện khu vực kết quả

        if (documents.length === 0) {
            // Nếu không có kết quả
            noResultsMessage.classList.remove('d-none'); // Hiện thông báo "Không tìm thấy"
            paginationContainer.style.display = 'none'; // Ẩn phân trang
        } else {
            // Nếu có kết quả
            noResultsMessage.classList.add('d-none'); // Ẩn thông báo
            
            // Tạo header cho bảng kết quả
            const header = `
                <div class="list-group-item document-item document-item-header">
                    <span>Tên tài liệu</span>
                    <span>Tác giả</span>
                    <span>Tóm tắt</span>
                </div>
            `;
            documentList.innerHTML += header;

            // Lặp qua từng tài liệu và tạo HTML
            documents.forEach(doc => {
                const documentElement = document.createElement('a');
                documentElement.href = doc.file_url; // Link đến file
                documentElement.target = '_blank'; // Mở trong tab mới
                documentElement.classList.add('list-group-item', 'list-group-item-action', 'document-item');

                documentElement.innerHTML = `
                    <span class="doc-title">${doc.ten_tai_lieu}</span>
                    <span class="doc-author">${doc.tac_gia}</span>
                    <span class="doc-description">${doc.mo_ta}</span>
                `;
                documentList.appendChild(documentElement);
            });

        }
    }
});