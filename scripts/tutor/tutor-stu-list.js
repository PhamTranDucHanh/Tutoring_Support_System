// document.addEventListener('DOMContentLoaded', async () => {
//   const container = document.getElementById('studentList');

//   try {
//     const response = await fetch('/data/stu.json');
//     if (!response.ok) throw new Error('Không tải được danh sách sinh viên');
    
//     const students = await response.json();

//     if (students.length === 0) {
//       container.innerHTML = '<div class="col-12 text-center text-muted">Chưa có sinh viên nào</div>';
//       return;
//     }

//     students.forEach(stu => {
//       const initials = stu.fullName.split(' ').map(n => n[0]).join('').slice(-2);

//       const card = document.createElement('div');
//       card.className = 'col';
//       card.innerHTML = `
//         <div class="student-card">
//           <div class="avatar">${initials}</div>
//           <h5>${stu.fullName}</h5>
//           <div class="mssv">MSSV: ${stu.id}</div>
//           <small>Lớp L01</small>
//         </div>
//       `;

//       card.addEventListener('click', () => {
//         const params = new URLSearchParams({
//           id: stu.id,
//           name: stu.fullName,
//           class: 'L01'
//         });
//         window.location.href = `/tutor/tutor-feedback.html?${params.toString()}`;
//       });

//       container.appendChild(card);
//     });

//   } catch (error) {
//     console.error(error);
//     container.innerHTML = `<div class="col-12 text-center text-danger">Lỗi: ${error.message}</div>`;
//   }
// });