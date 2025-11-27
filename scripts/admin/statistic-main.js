/*
    Cleaned and refactored statistic-main.js
    - Encapsulated in an IIFE
    - Grouped data, config, helpers and chart logic
    - Preserves previous behaviour
*/
(function () {
  'use strict';

  // ==================== RUNTIME STATE ====================
  let currentChart = null;

  // Data cache
  let stuData = [];
  let tutorData = [];
  let crsData = [];
  let docData = [];
  let fbData = [];
  let evaData = [];
  let statsReports = [];
  let cmpReports = [];

  // Computed statistics
  let studentCount = 0;
  let registeredCrsStuCount = 0;
  let avgCourses = 0;
  let tutorCount = 0;
  let assignedCrsTutorCount = 0;
  let avgAssignedCrsTutor = 0;
  let perAvgRatingTutor = [];
  let crsCount = 0;
  let currentStudentsCount = 0;
  let totalSessionsCount = 0;
  let totalDurationArr = [];
  let docCount = 0;
  let docTypeCount = 0;
  let docDepartmentCount = 0;
  let statstsReporCount = 0;
  let cmpReportsCount = 0;

  // ==================== CONFIGURATION ====================
  const criteriaConfig = {
    students: {
      criteria1: [
        { value: 'total', label: 'Tổng số sinh viên' },
        { value: 'totalRegisteredCrs', label: 'Tổng số khóa học đăng ký' },
        { value: 'avgCourses', label: 'Số khóa học trung bình' },
        { value: 'perStudent', label: 'Phân tích chi tiết' },
      ],
      criteria2: {
        total: [],
        totalRegisteredCrs: [],
        avgCourses: [],
        perStudent: [{ value: 'perCrs', label: 'Số khóa học mỗi sinh viên' }],
      },
      criteria3: {
        perCrs: [],
      },
    },
    tutors: {
      criteria1: [
        { value: 'total', label: 'Tổng số gia sư' },
        { value: 'totalAssignedCrs', label: 'Tổng số khóa học được giao' },
        { value: 'perTutor', label: 'Phân tích chi tiết' },
      ],
      criteria2: {
        total: [],
        totalAssignedCrs: [],
        perTutor: [
          { value: 'perCrs', label: 'Số khóa học mỗi gia sư' },
          {
            value: 'perAvgRating',
            label: 'Điểm đánh giá trung bình mỗi gia sư',
          },
        ],
      },
      criteria3: {
        perCrs: [],
        perAvgRating: [],
      },
    },
    courses: {
      criteria1: [
        { value: 'total', label: 'Tổng số khóa học' },
        { value: 'students', label: 'Theo sinh viên' },
        { value: 'sessions', label: 'Theo buổi học' },
      ],
      criteria2: {
        total: [],
        students: [
          { value: 'maxStudents', label: 'Số SV tối đa' },
          { value: 'currentStudents', label: 'Số SV hiện tại' },
          { value: 'avgStudents', label: 'Số SV trung bình' },
        ],
        sessions: [
          { value: 'totalSessions', label: 'Tổng số buổi học' },
          { value: 'duration', label: 'Thời lượng buổi học' },
          { value: 'modes', label: 'Hình thức học' },
        ],
      },
      criteria3: {
        duration: [],
        modes: [],
      },
    },
    documents: {
      criteria1: [
        { value: 'total', label: 'Tổng số tài liệu' },
        { value: 'byType', label: 'Theo loại tài liệu' },
        { value: 'department', label: 'Theo khoa' },
      ],
      criteria2: {
        total: [],
        byType: [],
        department: [],
      },
      criteria3: {},
    },
    'stu-feedbacks': {
      criteria1: [
        { value: 'total', label: 'Tổng số phản hồi' },
        { value: 'byCourse', label: 'Theo khóa học' },
        { value: 'byStudent', label: 'Theo sinh viên' },
      ],
      criteria2: {
        total: [],
        byCourse: [],
        byStudent: [],
      },
      criteria3: {},
    },
    evaluations: {
      criteria1: [{ value: 'total', label: 'Tổng số đánh giá' }],
      criteria2: {
        total: [],
      },
      criteria3: {},
    },
    reports: {
      criteria1: [{ value: 'total', label: 'Tổng số báo cáo' }],
      criteria2: {
        total: [],
      },
      criteria3: {},
    },
  };

  // ==================== DOM HELPERS ====================
  const $id = (id) => document.getElementById(id);

  // ==================== CHART RENDERING ====================
  function renderDynamicChart(title, labels, data) {
    if (currentChart) {
      currentChart.destroy();
    }

    const canvas = $id('mainChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: [
              '#3a89bf',
              '#6f42c1',
              '#28a745',
              '#ffc107',
              '#dc3545',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
        },
      },
    });
  }

  // ==================== SELECT POPULATION ====================
  function populateCriteriaSelect(
    selectElement,
    options,
    placeholder = 'Chọn tiêu chí'
  ) {
    if (!selectElement) return;
    selectElement.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = placeholder;
    selectElement.appendChild(defaultOpt);

    if (!options || options.length === 0) {
      selectElement.disabled = true;
      return;
    }

    options.forEach((opt) => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      selectElement.appendChild(el);
    });

    selectElement.disabled = false;
  }

  // ==================== CRITERIA UPDATES ====================
  function updateCriteria2(objectType, criteria1Value) {
    const criteriaSelectSecond = $id('tieuchi2');
    const criteriaSelectThird = $id('tieuchi3');
    const config = criteriaConfig[objectType];

    if (!config || !config.criteria2) {
      populateCriteriaSelect(criteriaSelectSecond, [], 'Không có tiêu chí');
      populateCriteriaSelect(criteriaSelectThird, [], 'Không có tiêu chí');
      return;
    }

    const options2 = config.criteria2[criteria1Value] || [];
    populateCriteriaSelect(criteriaSelectSecond, options2, 'Chọn tiêu chí 2');
    populateCriteriaSelect(criteriaSelectThird, [], 'Chọn tiêu chí 3');

    if (options2.length > 0) {
      criteriaSelectSecond.value = options2[0].value;
      updateCriteria3(objectType, options2[0].value);
    } else {
      updateChartWithAllCriteria();
    }
  }

  function updateCriteria3(objectType, criteria2Value) {
    const criteriaSelectThird = $id('tieuchi3');
    const config = criteriaConfig[objectType];

    if (!config || !config.criteria3) {
      populateCriteriaSelect(criteriaSelectThird, [], 'Không có tiêu chí');
      updateChartWithAllCriteria();
      return;
    }

    const options3 = config.criteria3[criteria2Value] || [];
    populateCriteriaSelect(criteriaSelectThird, options3, 'Chọn tiêu chí 3');

    if (options3.length > 0) {
      criteriaSelectThird.value = options3[0].value;
    }

    updateChartWithAllCriteria();
  }

  function updateAllCriteriaSelects(objectType) {
    const criteriaSelectFirst = $id('tieuchi1');
    const criteriaSelectSecond = $id('tieuchi2');
    const criteriaSelectThird = $id('tieuchi3');
    const config = criteriaConfig[objectType];

    if (!config) {
      populateCriteriaSelect(criteriaSelectFirst, [], 'Không có tiêu chí');
      populateCriteriaSelect(criteriaSelectSecond, [], 'Không có tiêu chí');
      populateCriteriaSelect(criteriaSelectThird, [], 'Không có tiêu chí');
      return;
    }

    populateCriteriaSelect(
      criteriaSelectFirst,
      config.criteria1,
      'Chọn tiêu chí 1'
    );

    if (config.criteria1.length > 0) {
      criteriaSelectFirst.value = config.criteria1[0].value;
      updateCriteria2(objectType, config.criteria1[0].value);
    } else {
      populateCriteriaSelect(criteriaSelectSecond, [], 'Không có tiêu chí');
      populateCriteriaSelect(criteriaSelectThird, [], 'Không có tiêu chí');
    }
  }

  // ==================== CHART UPDATE LOGIC ====================
  function updateChartWithAllCriteria() {
    const ObjSelect = $id('doituong');
    const criteriaSelectFirst = $id('tieuchi1');
    const criteriaSelectSecond = $id('tieuchi2');

    const objectType = ObjSelect?.value || '';
    const criteria1 = criteriaSelectFirst?.value || '';
    const criteria2 = criteriaSelectSecond?.value || '';

    if (!objectType) {
      renderDynamicChart(
        'Chọn đối tượng để xem thống kê',
        ['Chưa có dữ liệu'],
        [0]
      );
      return;
    }

    // Students
    if (objectType === 'students') {
      if (criteria1 === 'total') {
        renderDynamicChart('Tổng số sinh viên', ['Sinh viên'], [studentCount]);
      } else if (criteria1 === 'totalRegisteredCrs') {
        renderDynamicChart(
          'Tổng khóa học đăng ký',
          ['Khóa học đăng ký'],
          [registeredCrsStuCount]
        );
      } else if (criteria1 === 'avgCourses') {
        renderDynamicChart(
          'Số khóa học trung bình',
          ['Trung bình'],
          [avgCourses]
        );
      } else if (criteria1 === 'perStudent' && criteria2 === 'perCrs') {
        const crsCountperStu = stuData.map((stu) =>
          stu.registeredCourses ? stu.registeredCourses.length : 0
        );
        renderDynamicChart(
          'Số khóa học đăng ký mỗi sinh viên',
          stuData.map((stu) => stu.username || 'N/A'),
          crsCountperStu
        );
      } else {
        renderDynamicChart(
          'Sinh viên - Tổng quan',
          ['Tổng SV', 'Khóa học đăng ký', 'TB khóa học/SV'],
          [studentCount, registeredCrsStuCount, parseFloat(avgCourses)]
        );
      }
      return;
    }

    // Tutors
    if (objectType === 'tutors') {
      if (criteria1 === 'total') {
        renderDynamicChart('Tổng số gia sư', ['Gia sư'], [tutorCount]);
      } else if (criteria1 === 'totalAssignedCrs') {
        renderDynamicChart(
          'Tổng số khóa học được giao',
          ['Khóa học được giao'],
          [assignedCrsTutorCount]
        );
      } else if (criteria1 === 'perTutor') {
        if (criteria2 === 'perCrs') {
          const crsCountperTutor = tutorData.map((tutor) =>
            tutor.courses ? tutor.courses.length : 0
          );
          renderDynamicChart(
            'Số khóa học được giao mỗi gia sư',
            tutorData.map((tutor) => tutor.username || 'N/A'),
            crsCountperTutor
          );
        } else if (criteria2 === 'perAvgRating') {
          renderDynamicChart(
            'Đánh giá trung bình mỗi gia sư',
            tutorData.map((tutor) => tutor.username || 'N/A'),
            perAvgRatingTutor
          );
        }
      } else {
        renderDynamicChart(
          'Gia sư - Tổng quan',
          ['Tổng gia sư', 'Khóa học được giao', 'TB khóa học/gia sư'],
          [tutorCount, assignedCrsTutorCount, parseFloat(avgAssignedCrsTutor)]
        );
      }
      return;
    }

    // Courses
    if (objectType === 'courses') {
      if (criteria1 === 'total') {
        renderDynamicChart('Tổng số khóa học', ['Khóa học'], [crsCount]);
      } else if (criteria1 === 'students') {
        if (criteria2 === 'maxStudents') {
          const maxStudentsArr = crsData.map((c) => c.maxStudents || 0);
          renderDynamicChart(
            'Số SV tối đa mỗi khóa học',
            crsData.map((c) => c.title || 'N/A'),
            maxStudentsArr
          );
        } else if (criteria2 === 'currentStudents') {
          const currentStudentsArr = crsData.map(
            (c) => c.numCurrentStudents || 0
          );
          renderDynamicChart(
            'Số SV hiện tại mỗi khóa học',
            crsData.map((c) => c.title || 'N/A'),
            currentStudentsArr
          );
        } else if (criteria2 === 'avgStudents') {
          const avgStudentsArr = crsData.map((c) => {
            if (c.numCurrentStudents && c.numCurrentStudents.length > 0) {
              return parseFloat(
                (c.numCurrentStudents.length / (c.totalSessions || 1)).toFixed(
                  2
                )
              );
            }
            return 0;
          });
          renderDynamicChart(
            'Số SV trung bình mỗi buổi học',
            crsData.map((c) => c.title || 'N/A'),
            avgStudentsArr
          );
        }
      } else if (criteria1 === 'sessions') {
        if (criteria2 === 'totalSessions') {
          const totalSessionsArr = crsData.map(
            (c) => c.numCurrentSessions || 0
          );
          renderDynamicChart(
            'Tổng số buổi học mỗi khóa học',
            crsData.map((c) => c.title || 'N/A'),
            totalSessionsArr
          );
        } else if (criteria2 === 'duration') {
          renderDynamicChart(
            'Thời lượng buổi học mỗi khóa học (giờ)',
            crsData.map((c) => c.title || 'N/A'),
            totalDurationArr
          );
        } else if (criteria2 === 'modes') {
          const modesData = { Online: 0, Offline: 0, Hybrid: 0 };
          crsData.forEach((c) => {
            if (c.sessions) {
              c.sessions.forEach((session) => {
                if (session.mode && Object.prototype.hasOwnProperty.call(modesData, session.mode)) {
                  modesData[session.mode]++;
                }
              });
            }
          });
          renderDynamicChart(
            'Hình thức học tổng hợp',
            ['Online', 'Offline', 'Hybrid'],
            [modesData.Online, modesData.Offline, modesData.Hybrid]
          );
        }
      } else {
        renderDynamicChart(
          'Khóa học - Tổng quan',
          ['Tổng khóa học', 'Tổng SV hiện tại', 'Tổng buổi học'],
          [crsCount, currentStudentsCount, totalSessionsCount]
        );
      }
      return;
    }

    // Documents
    if (objectType === 'documents') {
      if (criteria1 === 'total') {
        renderDynamicChart('Tổng số tài liệu', ['Tài liệu'], [docCount]);
      } else if (criteria1 === 'byType') {
        const typeCounts = {};
        docData.forEach((doc) => {
          const type = doc.loai_tai_lieu || 'Khác';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        renderDynamicChart(
          'Số tài liệu theo loại',
          Object.keys(typeCounts),
          Object.values(typeCounts)
        );
      } else if (criteria1 === 'department') {
        const departmentCounts = {};
        docData.forEach((doc) => {
          const department = doc.thuoc_bo_mon || 'Khác';
          departmentCounts[department] =
            (departmentCounts[department] || 0) + 1;
        });
        renderDynamicChart(
          'Số tài liệu theo khoa',
          Object.keys(departmentCounts),
          Object.values(departmentCounts)
        );
      } else {
        renderDynamicChart(
          'Tài liệu - Tổng quan',
          ['Tổng tài liệu', 'Số loại', 'Số khoa'],
          [docCount, docTypeCount, docDepartmentCount]
        );
      }
      return;
    }

    // Feedbacks
    if (objectType === 'stu-feedbacks') {
      if (criteria1 === 'total') {
        renderDynamicChart('Tổng số phản hồi', ['Phản hồi'], [fbData.length]);
      } else if (criteria1 === 'byCourse') {
        const courseCounts = {};
        fbData.forEach((fb) => {
          const course = fb.courseId || 'Khác';
          courseCounts[course] = (courseCounts[course] || 0) + 1;
        });
        renderDynamicChart(
          'Số phản hồi theo khóa học',
          Object.keys(courseCounts),
          Object.values(courseCounts)
        );
      } else if (criteria1 === 'byStudent') {
        const typeCounts = {};
        fbData.forEach((fb) => {
          const stuID = fb.studentId || 'Khác';
          const stuUsername =
            stuData.find((stu) => stu.id === stuID)?.username || 'N/A';
          typeCounts[stuUsername] = (typeCounts[stuUsername] || 0) + 1;
        });
        renderDynamicChart(
          'Số phản hồi theo sinh viên',
          Object.keys(typeCounts),
          Object.values(typeCounts)
        );
      }
      return;
    }

    // Evaluations
    if (objectType === 'evaluations') {
      renderDynamicChart(
        'Tổng số đánh giá gia sư',
        ['Đánh giá'],
        [evaData.length]
      );
      return;
    }

    // Reports
    if (objectType === 'reports') {
      renderDynamicChart(
        'Báo cáo',
        ['Báo cáo thống kê', 'Báo cáo so sánh'],
        [statstsReporCount, cmpReportsCount]
      );
      return;
    }

    // Default
    renderDynamicChart(
      'Chọn đối tượng để xem thống kê',
      ['Chưa có dữ liệu'],
      [0]
    );
  }

  // ==================== DATA LOADING ====================
  async function loadDataAndRender() {
    try {
      const [
        stuResp,
        tutorResp,
        crsResp,
        docResp,
        fbResp,
        evaResp,
        sResp,
        cResp,
      ] = await Promise.all([
        fetch('/api/data/stu.json'),
        fetch('/api/data/tutor.json'),
        fetch('/api/data/courses.json'),
        fetch('/api/data/document.json'),
        fetch('/api/data/stu-feedback.json'),
        fetch('/api/data/tutor-evaluate.json'),
        fetch('/api/data/stats-reports.json'),
        fetch('/api/data/cmp-reports.json'),
      ]);

      if (
        !stuResp.ok ||
        !tutorResp.ok ||
        !crsResp.ok ||
        !docResp.ok ||
        !fbResp.ok ||
        !evaResp.ok
      ) {
        throw new Error('Không tải được dữ liệu');
      }

      stuData = await stuResp.json();
      tutorData = await tutorResp.json();
      crsData = await crsResp.json();
      docData = await docResp.json();
      fbData = await fbResp.json();
      evaData = await evaResp.json();

      if (sResp.ok && cResp.ok) {
        statsReports = await sResp.json();
        cmpReports = await cResp.json();
        statstsReporCount = statsReports.length;
        cmpReportsCount = cmpReports.length;
      }

      // Calculate statistics
      calculateStatistics();

      // Populate object select
      populateObjectSelect();
    } catch (err) {
      console.error('Lỗi load dữ liệu:', err);
      renderDynamicChart('Lỗi tải dữ liệu', ['Error'], [0]);
    }
  }

  function calculateStatistics() {
    // Students
    studentCount = stuData.length;
    registeredCrsStuCount = stuData.reduce(
      (total, c) =>
        total + (c.registeredCourses ? c.registeredCourses.length : 0),
      0
    );
    avgCourses =
      studentCount > 0 ? (registeredCrsStuCount / studentCount).toFixed(2) : 0;

    // Tutors
    tutorCount = tutorData.length;
    assignedCrsTutorCount = tutorData.reduce(
      (total, c) => total + (c.courses ? c.courses.length : 0),
      0
    );
    avgAssignedCrsTutor =
      tutorCount > 0 ? (assignedCrsTutorCount / tutorCount).toFixed(2) : 0;
    perAvgRatingTutor = tutorData.map((tutor) => {
      const ratingArr = crsData.filter(
        (course) =>
          course.tutors && course.tutors.some((t) => t.id === tutor.id)
      );
      if (ratingArr.length === 0) return 0;
      const totalRating = ratingArr.reduce((sum, c) => {
        const t = c.tutors.find((t) => t.id === tutor.id);
        return sum + (t.rating || 0);
      }, 0);
      return parseFloat((totalRating / ratingArr.length).toFixed(2));
    });

    // Courses
    crsCount = crsData.length;
    currentStudentsCount = crsData.reduce(
      (total, c) => total + (c.currentStudents ? c.currentStudents.length : 0),
      0
    );
    totalSessionsCount = crsData.reduce(
      (total, c) => total + (c.totalSessions ? c.totalSessions : 0),
      0
    );

    function diffHours(start, end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return (endMin - startMin) / 60;
    }

    totalDurationArr = crsData.map((c) => {
      if (!c.sessions || c.sessions.length === 0) return 0;
      const duration = c.sessions
        .map((session) =>
          diffHours(session.start || '00:00', session.end || '00:00')
        )
        .reduce((a, b) => a + b, 0);
      return parseFloat(duration.toFixed(2));
    });

    // Documents
    docCount = docData.length;
    const typeSet = new Set();
    const deptSet = new Set();
    docData.forEach((d) => {
      if (d.loai_tai_lieu) typeSet.add(d.loai_tai_lieu);
      if (d.thuoc_bo_mon) deptSet.add(d.thuoc_bo_mon);
    });
    docTypeCount = typeSet.size;
    docDepartmentCount = deptSet.size;
  }

  function populateObjectSelect() {
    const ObjSelect = $id('doituong');
    if (!ObjSelect) return;

    const objOptions = [
      { value: 'students', label: 'Sinh viên' },
      { value: 'tutors', label: 'Gia sư' },
      { value: 'courses', label: 'Khóa học' },
      { value: 'documents', label: 'Tài liệu' },
      { value: 'stu-feedbacks', label: 'Phản hồi' },
      { value: 'evaluations', label: 'Đánh giá' },
      { value: 'reports', label: 'Báo cáo' },
    ];

    ObjSelect.innerHTML = '';
    objOptions.forEach((opt) => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      ObjSelect.appendChild(el);
    });

    ObjSelect.value = 'students';
    updateAllCriteriaSelects('students');
  }

  // ==================== UTILITY FUNCTIONS ====================
  window.clearField = function (fieldId) {
    const field = $id(fieldId);
    if (field) field.value = '';
  };

  window.resetAllFilters = function () {
    const ObjSelect = $id('doituong');
    const criteriaSelectFirst = $id('tieuchi1');
    const criteriaSelectSecond = $id('tieuchi2');
    const criteriaSelectThird = $id('tieuchi3');

    if (ObjSelect) ObjSelect.value = '';
    if (criteriaSelectFirst) criteriaSelectFirst.value = '';
    if (criteriaSelectSecond) criteriaSelectSecond.value = '';
    if (criteriaSelectThird) criteriaSelectThird.value = '';

    renderDynamicChart(
      'Chọn đối tượng để xem thống kê',
      ['Chưa có dữ liệu'],
      [0]
    );
  };

  window.updateChartWithAllCriteria = updateChartWithAllCriteria;

  // ==================== EVENT HANDLERS ====================
  function init() {
    const canvas = $id('mainChart');
    if (!canvas) {
      console.error('Không tìm thấy canvas với id="mainChart"');
      return;
    }

    const ObjSelect = $id('doituong');
    const criteriaSelectFirst = $id('tieuchi1');
    const criteriaSelectSecond = $id('tieuchi2');
    const criteriaSelectThird = $id('tieuchi3');

    if (
      !ObjSelect ||
      !criteriaSelectFirst ||
      !criteriaSelectSecond ||
      !criteriaSelectThird
    ) {
      console.error('Thiếu select elements');
      return;
    }

    // Event listeners
    ObjSelect.addEventListener('change', function () {
      updateAllCriteriaSelects(this.value);
    });

    criteriaSelectFirst.addEventListener('change', function () {
      const objectType = ObjSelect.value;
      updateCriteria2(objectType, this.value);
    });

    criteriaSelectSecond.addEventListener('change', function () {
      const objectType = ObjSelect.value;
      updateCriteria3(objectType, this.value);
    });

    criteriaSelectThird.addEventListener('change', function () {
      updateChartWithAllCriteria();
    });

    // Init data load
    loadDataAndRender();
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
