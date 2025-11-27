/*
    Cleaned and refactored statistic-cmp.js
    - Encapsulated in an IIFE
    - Grouped helpers, loaders, renderers and actions
    - Preserves previous behaviour and endpoints
*/
(function () {
    'use strict';

    // ==================== DOM HELPERS ====================
    const $id = (id) => document.getElementById(id);
    const TAB_BTN_SELECTOR = '.tab-btn';

    // ==================== CACHED DOM ELEMENTS ====================
    const compareTypeEl = $id('compareType');
    const obj1El = $id('object1');
    const obj2El = $id('object2');
    const compareBtn = $id('compareBtn');
    const resetBtn = $id('resetBtn');
    const createReportBtn = $id('createReportBtn');
    const resultTabBtn = $id('resultTabBtn');

    // ==================== RUNTIME STATE ====================
    let statsReports = [];
    const dataCache = {};
    let lastComparison = null;

    // ==================== CONFIGURATION ====================
    const dataObjects = [
        { value: 'students', label: 'Sinh viên' },
        { value: 'tutors', label: 'Gia sư' },
        { value: 'courses', label: 'Khóa học' },
        { value: 'stu-feedbacks', label: 'Phản hồi' },
        { value: 'documents', label: 'Tài liệu' },
        { value: 'evaluations', label: 'Đánh giá' },
    ];

    const dataFileMapping = {
        students: '/api/data/stu.json',
        tutors: '/api/data/tutor.json',
        courses: '/api/data/courses.json',
        'stu-feedbacks': '/api/data/stu-feedback.json',
        evaluations: '/api/data/tutor-evaluate.json',
        documents: '/api/data/document.json',
    };

    // ==================== SMALL HELPERS ====================
    const fetchJson = async (url) => {
        try {
            const r = await fetch(url);
            if (!r.ok) return null;
            return await r.json();
        } catch {
            return null;
        }
    };

    function formatDate(d) {
        if (!d) return '';
        try {
            return new Date(d).toLocaleString();
        } catch {
            return d;
        }
    }

    function labelFor(type, key) {
        if (type === 'report') {
            const r = statsReports.find((rr) => rr.id === key) || {};
            return r.name || key;
        }
        const map = {
            students: 'Sinh viên',
            tutors: 'Gia sư',
            courses: 'Khóa học',
            'stu-feedbacks': 'Phản hồi',
            documents: 'Tài liệu',
            evaluations: 'Đánh giá',
        };
        return map[key] || key;
    }

    // ==================== SELECT HELPERS ====================
    function populateSelect(el, items = [], placeholder = 'Chọn...') {
        if (!el) return;
        el.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        el.appendChild(placeholderOption);
        items.forEach((it) => {
            const o = document.createElement('option');
            o.value = it.value;
            o.textContent = it.label;
            el.appendChild(o);
        });
    }

    function populateSelectWithExclusion(
        el,
        items = [],
        excludeValue = '',
        placeholder = 'Chọn...'
    ) {
        if (!el) return;
        const prev = el.value;
        el.innerHTML = '';
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = placeholder;
        el.appendChild(ph);
        (items || []).forEach((it) => {
            if (
                excludeValue &&
                String(it.value) === String(excludeValue) &&
                String(prev) !== String(excludeValue)
            )
                return;
            const o = document.createElement('option');
            o.value = it.value;
            o.textContent = it.label;
            el.appendChild(o);
        });
        if (prev) {
            try {
                el.value = prev;
            } catch { /* ignore */ }
            if (el.value !== prev) el.value = '';
        }
    }

    // ==================== LOADERS ====================
    async function loadReports() {
        const data = await fetchJson('/api/data/stats-reports.json');
        statsReports = Array.isArray(data) ? data : [];
        handleCompareTypeChange();
        updateCompareButtonState();
    }

    async function loadDataFiles() {
        const keys = Object.keys(dataFileMapping);
        await Promise.all(
            keys.map(async (k) => {
                const json = await fetchJson(dataFileMapping[k]);
                dataCache[k] = Array.isArray(json) ? json : json || [];
            })
        );
        updateCompareButtonState();
    }

    // ==================== UI STATE & VALIDATION ====================
    function isValidSelection(type, value) {
        if (!value) return false;
        if (type === 'report') return statsReports.some((r) => r.id === value);
        return dataObjects.some((d) => d.value === value);
    }

    function updateCompareButtonState() {
        if (!compareBtn) return;
        const type = compareTypeEl?.value || 'data';
        const v1 = obj1El?.value || '';
        const v2 = obj2El?.value || '';
        const ok =
            v1 &&
            v2 &&
            v1 !== v2 &&
            isValidSelection(type, v1) &&
            isValidSelection(type, v2);
        compareBtn.disabled = !ok;
        if (resultTabBtn) resultTabBtn.disabled = true;
        if (createReportBtn) createReportBtn.disabled = true;
    }

    function switchToSearchTab() {
        document
            .querySelectorAll(TAB_BTN_SELECTOR)
            .forEach((b) => b.classList.remove('active'));
        document
            .querySelectorAll('.tab-content')
            .forEach((t) => t.classList.remove('active'));
        document
            .querySelector('.tab-btn[data-tab="search"]')
            ?.classList.add('active');
        $id('search-tab')?.classList.add('active');
    }

    function handleCompareTypeChange() {
        const t = compareTypeEl?.value;
        const isDisabled = !t;

        obj1El.disabled = isDisabled;
        obj2El.disabled = isDisabled;

        if (isDisabled) {
            populateSelect(obj1El, [], 'Vui lòng chọn loại so sánh');
            populateSelect(obj2El, [], 'Vui lòng chọn loại so sánh');
            return;
        }

        if (t === 'report') {
            const items = statsReports.map((r) => ({
                value: r.id || r.name || JSON.stringify(r),
                label: r.name || r.id || 'Untitled',
            }));
            populateSelectWithExclusion(
                obj1El,
                items,
                obj2El?.value,
                'Chọn báo cáo thứ nhất'
            );
            populateSelectWithExclusion(
                obj2El,
                items,
                obj1El?.value,
                'Chọn báo cáo thứ hai'
            );
        } else {
            populateSelectWithExclusion(
                obj1El,
                dataObjects,
                obj2El?.value,
                'Chọn đối tượng thứ nhất'
            );
            populateSelectWithExclusion(
                obj2El,
                dataObjects,
                obj1El?.value,
                'Chọn đối tượng thứ hai'
            );
        }
    }

    // ==================== TABLE RENDER HELPERS ====================
    function setTableHead(targetHeadId, columns) {
        const row = $id(targetHeadId);
        if (!row) return;
        row.innerHTML = '';
        columns.forEach((c) => {
            const th = document.createElement('th');
            if (c.className) th.className = c.className;
            th.textContent = c.label;
            row.appendChild(th);
        });
    }

    function setTableBodySingleRow(targetBodyId, label, values) {
        const tbody = $id(targetBodyId);
        if (!tbody) return;
        tbody.innerHTML = '';
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        tdLabel.className = 'ps-4 fw-semibold';
        tdLabel.textContent = label;
        tr.appendChild(tdLabel);
        (values || []).forEach((v) => {
            const td = document.createElement('td');
            td.textContent = v === undefined || v === null ? '-' : v;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }

    function setTableBodyRows(targetBodyId, rows) {
        const tbody = $id(targetBodyId);
        if (!tbody) return;
        tbody.innerHTML = '';
        rows.forEach((r) => {
            const tr = document.createElement('tr');
            (r.cells || []).forEach((c) => {
                const td = document.createElement('td');
                td.textContent = c === undefined || c === null ? '-' : c;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    // ==================== METRICS EXTRACTION ====================
    function createReportMetrics(r) {
        if (!r) return {};
        return {
            name: r.name || r.id || '-',
            type: r.type || '-',
            updatedAt: formatDate(r.updatedAt),
            numCourses:
                r.numCourses ??
                (r.courses &&
                    (r.courses.total ??
                        (Array.isArray(r.courses.details)
                            ? r.courses.details.length
                            : undefined))) ??
                '-',
            numStudents: r.numStudents ?? '-',
            numTutors: r.numTutors ?? '-',
            numSessions: r.numSessions ?? '-',
            avgSessionsPerCourse: r.averageSessionsPerCourse ?? '-',
            avgStudentsPerCourse: r.averageStudentsPerCourse ?? '-',
        };
    }

    function getDataMetrics(key, arr) {
        const items = arr || [];
        switch (key) {
            case 'students': {
                const total = items.length;
                const avgRegistered =
                    total === 0
                        ? 0
                        : (
                            items.reduce(
                                (s, i) =>
                                    s +
                                    (Array.isArray(i.registeredCourses)
                                        ? i.registeredCourses.length
                                        : 0),
                                0
                            ) / total
                        ).toFixed(2);
                return { total, avgRegistered };
            }
            case 'tutors': {
                const total = items.length;
                const totalCourses = items.reduce(
                    (s, i) => s + (Array.isArray(i.courses) ? i.courses.length : 0),
                    0
                );
                const avgCourses = total === 0 ? 0 : (totalCourses / total).toFixed(2);
                return { total, totalCourses, avgCourses };
            }
            case 'courses': {
                const total = items.length;
                const totalSessions = items.reduce(
                    (s, i) => s + (Array.isArray(i.sessions) ? i.sessions.length : 0),
                    0
                );
                const avgSessions =
                    total === 0 ? 0 : (totalSessions / total).toFixed(2);
                const totalStudents = items.reduce(
                    (s, i) => s + (i.numCurrentStudents ?? 0),
                    0
                );
                return { total, totalSessions, avgSessions, totalStudents };
            }
            case 'stu-feedbacks':
                return { total: items.length };
            case 'evaluations':
                return { total: items.length };
            default:
                return {};
        }
    }

    function buildMetrics(type, key) {
        if (type === 'report')
            return createReportMetrics(
                statsReports.find((rr) => rr.id === key) || {}
            );
        switch (key) {
            case 'students': {
                const arr = dataCache['students'] || [];
                return {
                    total: arr.length,
                    totalRegistered: arr.reduce(
                        (s, i) =>
                            s +
                            (Array.isArray(i.registeredCourses)
                                ? i.registeredCourses.length
                                : 0),
                        0
                    ),
                    totalFeedback: (dataCache['stu-feedbacks'] || []).length,
                };
            }
            case 'tutors': {
                const arr = dataCache['tutors'] || [];
                return {
                    total: arr.length,
                    totalCourses: arr.reduce(
                        (s, i) => s + (Array.isArray(i.courses) ? i.courses.length : 0),
                        0
                    ),
                    totalEvals: (dataCache['evaluations'] || []).length,
                };
            }
            case 'courses': {
                const arr = dataCache['courses'] || [];
                return {
                    total: arr.length,
                    totalStudentsCur: arr.reduce(
                        (s, i) => s + (i.numCurrentStudents || 0),
                        0
                    ),
                    totalSessionsCur: arr.reduce(
                        (s, i) =>
                            s +
                            (i.numCurrentSessions ||
                                (Array.isArray(i.sessions) ? i.sessions.length : 0)),
                        0
                    ),
                };
            }
            case 'documents': {
                const arr = dataCache['documents'] || [];
                return {
                    total: arr.length,
                    types: Array.from(
                        new Set(arr.map((d) => d.loai_tai_lieu).filter(Boolean))
                    ).length,
                    subjects: Array.from(
                        new Set(arr.map((d) => d.thuoc_bo_mon).filter(Boolean))
                    ).length,
                };
            }
            case 'stu-feedbacks': {
                const arr = dataCache['stu-feedbacks'] || [];
                return {
                    total: arr.length,
                    rows: arr
                        .filter(
                            (f) =>
                                typeof f.rating === 'number' && f.rating >= 3 && f.rating <= 5
                        )
                        .map((f) => ({
                            id: f.id,
                            rating: f.rating,
                            courseId: f.courseId,
                            content: f.content,
                        })),
                };
            }
            case 'evaluations': {
                const arr = dataCache['evaluations'] || [];
                return {
                    total: arr.length,
                    rows: arr.map((ev) => ({
                        id: ev.id,
                        tutorId: ev.tutorId || ev.tutor,
                        studentId: ev.studentId,
                        comment: ev.comment,
                    })),
                };
            }
            default:
                return {};
        }
    }

    // ==================== RENDERERS ====================
    const renderStudents = (h, b, m) => {
        setTableHead(h, [
            { label: 'Dữ liệu' },
            { label: 'Số lượng học sinh' },
            { label: 'Tổng số khóa đăng ký' },
            { label: 'Tổng số feedback' },
        ]);
        const totalRegistered = (dataCache['students'] || []).reduce(
            (s, i) =>
                s +
                (Array.isArray(i.registeredCourses) ? i.registeredCourses.length : 0),
            0
        );
        const totalFeedback = (dataCache['stu-feedbacks'] || []).length;
        setTableBodySingleRow(b, 'Dữ liệu', [
            m.total ?? 0,
            totalRegistered,
            totalFeedback,
        ]);
    };

    const renderTutors = (h, b, m) => {
        setTableHead(h, [
            { label: 'Dữ liệu' },
            { label: 'Số lượng gia sư' },
            { label: 'Tổng số khóa được giao' },
            { label: 'Tổng số đánh giá' },
        ]);
        const totalCourses = (dataCache['tutors'] || []).reduce(
            (s, i) => s + (Array.isArray(i.courses) ? i.courses.length : 0),
            0
        );
        const totalEvals = (dataCache['evaluations'] || []).length;
        setTableBodySingleRow(b, 'Dữ liệu', [
            m.total ?? 0,
            totalCourses,
            totalEvals,
        ]);
    };

    const renderCourses = (h, b, m) => {
        setTableHead(h, [
            { label: 'Dữ liệu' },
            { label: 'Số khóa học' },
            { label: 'Tổng số sinh viên (hiện tại)' },
            { label: 'Tổng số buổi (hiện tại)' },
        ]);
        const totalStudentsCur = (dataCache['courses'] || []).reduce(
            (s, i) => s + (i.numCurrentStudents || 0),
            0
        );
        const totalSessionsCur = (dataCache['courses'] || []).reduce(
            (s, i) =>
                s +
                (i.numCurrentSessions ||
                    (Array.isArray(i.sessions) ? i.sessions.length : 0)),
            0
        );
        setTableBodySingleRow(b, 'Dữ liệu', [
            m.total ?? 0,
            totalStudentsCur,
            totalSessionsCur,
        ]);
    };

    const renderDocs = (h, b) => {
        setTableHead(h, [
            { label: 'Dữ liệu' },
            { label: 'Tổng số tài liệu' },
            { label: 'Tổng lượng loại tài liệu' },
            { label: 'Tổng số bộ môn' },
        ]);
        const docs = dataCache['documents'] || [];
        const types = Array.from(
            new Set(docs.map((d) => d.loai_tai_lieu).filter(Boolean))
        ).length;
        const subjects = Array.from(
            new Set(docs.map((d) => d.thuoc_bo_mon).filter(Boolean))
        ).length;
        setTableBodySingleRow(b, 'Dữ liệu', [docs.length, types, subjects]);
    };

    const renderFeedbacks = (h, b, arr) => {
        setTableHead(h, [
            { label: 'Rating' },
            { label: 'Course' },
            { label: 'Feedback' },
            { label: 'ID' },
        ]);
        const rows = (arr || [])
            .filter(
                (f) => typeof f.rating === 'number' && f.rating >= 3 && f.rating <= 5
            )
            .map((f) => ({
                cells: [
                    String(f.rating),
                    f.courseId || '-',
                    f.content || '-',
                    f.id || '-',
                ],
            }));
        if (rows.length === 0)
            rows.push({ cells: ['-', '-', 'Không có feedback (rating 3-5)', '-'] });
        setTableBodyRows(b, rows);
    };

    const renderEvaluations = (h, b, arr) => {
        setTableHead(h, [
            { label: 'ID giáo viên' },
            { label: 'ID học sinh' },
            { label: 'Comment' },
        ]);
        const rows = (arr || []).map((ev) => ({
            cells: [
                ev.tutorId || ev.tutor || '-',
                ev.studentId || '-',
                ev.comment || '-',
            ],
        }));
        if (rows.length === 0)
            rows.push({ cells: ['-', '-', 'Không có đánh giá'] });
        setTableBodyRows(b, rows);
    };

    // ==================== MAIN RENDERER ====================
    function createComparisonTable(type, leftKey, rightKey) {
        const dataArea = $id('dataComparison');
        const reportArea = $id('reportComparison');

        if (type === 'report') {
            if (dataArea) dataArea.style.display = 'none';
            if (reportArea) reportArea.style.display = '';
            const leftReport = statsReports.find((r) => r.id === leftKey) || null;
            const rightReport = statsReports.find((r) => r.id === rightKey) || null;
            const tbody = $id('reportTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            [leftReport, rightReport].filter(Boolean).forEach((r) => {
                const tr = document.createElement('tr');
                const idTd = document.createElement('td');
                idTd.textContent = r.id || '-';
                const ctd = document.createElement('td');
                ctd.textContent = r.content ?? r.description ?? JSON.stringify(r);
                tr.appendChild(idTd);
                tr.appendChild(ctd);
                tbody.appendChild(tr);
            });
            return;
        }

        if (dataArea) dataArea.style.display = '';
        if (reportArea) reportArea.style.display = 'none';
        const leftArr = dataCache[leftKey] || [];
        const rightArr = dataCache[rightKey] || [];
        const lm = getDataMetrics(leftKey, leftArr);
        const rm = getDataMetrics(rightKey, rightArr);

        const rendererMap = {
            students: (h, b, m) => renderStudents(h, b, m),
            tutors: (h, b, m) => renderTutors(h, b, m),
            courses: (h, b, m) => renderCourses(h, b, m),
            'stu-feedbacks': (h, b, arr) => renderFeedbacks(h, b, arr),
            evaluations: (h, b, arr) => renderEvaluations(h, b, arr),
            documents: (h, b) => renderDocs(h, b),
        };

        const defaultRenderer = (h, b) => {
            setTableHead(h, [{ label: 'Dữ liệu' }]);
            setTableBodySingleRow(b, 'Dữ liệu', ['-']);
        };

        const leftRenderer = rendererMap[leftKey] || defaultRenderer;
        const rightRenderer = rendererMap[rightKey] || defaultRenderer;

        if (['students', 'tutors', 'courses'].includes(leftKey)) {
            leftRenderer('leftTableHead', 'resultTableBodyLeft', lm);
        } else {
            leftRenderer('leftTableHead', 'resultTableBodyLeft', leftArr);
        }

        if (['students', 'tutors', 'courses'].includes(rightKey)) {
            rightRenderer('rightTableHead', 'resultTableBodyRight', rm);
        } else {
            rightRenderer('rightTableHead', 'resultTableBodyRight', rightArr);
        }
    }

    // ==================== REPORT CREATE/SAVE ====================
    function buildComparisonPayload(type, leftKey, rightKey, description) {
        const id = 'CMP_' + Math.floor(Math.random() * 1e9);
        const payload = {
            id,
            type: 'So sánh',
            name: `So sánh ${labelFor(type, leftKey)} vs ${labelFor(type, rightKey)}`,
            description: description || '',
            updatedAt: new Date().toISOString(),
            updatedBy: 'COO001',
            content: [],
        };
        const leftObj = {};
        leftObj[labelFor(type, leftKey)] = buildMetrics(type, leftKey);
        const rightObj = {};
        rightObj[labelFor(type, rightKey)] = buildMetrics(type, rightKey);
        payload.content.push(leftObj, rightObj);
        return payload;
    }

    async function saveComparisonReport(payload) {
        try {
            const resp = await fetch('/api/data/cmp-reports.json');
            let arr = [];
            if (resp.ok) {
                arr = await resp.json();
                if (!Array.isArray(arr)) arr = [];
            }
            arr.push(payload);
            const post = await fetch('/api/data/cmp-reports.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(arr, null, 2),
            });
            if (post.ok) {
                alert('Báo cáo đã lưu');
                return true;
            }
        } catch (e) {
            console.warn('Saving failed, fallback to download', e);
        }
        try {
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cmp-report-${payload.id}.json`;
            document.body.appendChild(a);
a.click();
            a.remove();
            URL.revokeObjectURL(url);
            alert('Báo cáo đã được tải xuống (file JSON)');
            return true;
        } catch (e) {
            alert('Không thể lưu báo cáo: ' + String(e));
            return false;
        }
    }

    // ==================== ACTIONS ====================
    function performCompare() {
        const left = obj1El?.value || '';
        const right = obj2El?.value || '';
        const type = compareTypeEl?.value || 'data';
        if (!left || !right)
            return alert('Vui lòng chọn đủ 2 đối tượng để so sánh!');

        if (type === 'report') {
            const r1 = statsReports.find((r) => r.id === left) || {};
            const r2 = statsReports.find((r) => r.id === right) || {};
            $id('header1').textContent = r1.name || left;
            $id('header2').textContent = r2.name || right;
        } else {
            $id('header1').textContent = labelFor(type, left);
            $id('header2').textContent = labelFor(type, right);
        }

        lastComparison = { type, left, right };
        createComparisonTable(type, left, right);
        if (resultTabBtn) resultTabBtn.disabled = false;
        if (createReportBtn) createReportBtn.disabled = false;
        document.querySelector('.tab-btn[data-tab="result"]')?.click();
    }

    function resetAll() {
        if (compareTypeEl) compareTypeEl.value = '';
        if (obj1El) obj1El.value = '';
        if (obj2El) obj2El.value = '';
        handleCompareTypeChange();
        lastComparison = null;
        updateCompareButtonState();
        if (createReportBtn) createReportBtn.disabled = true;
        if (resultTabBtn) resultTabBtn.disabled = true;
        [
            'resultTableBodyLeft',
            'resultTableBodyRight',
            'leftTableHead',
            'rightTableHead',
            'reportTableBody',
        ].forEach((id) => {
            const n = $id(id);
            if (n) n.innerHTML = '';
        });
        switchToSearchTab();
    }

    // ==================== EVENT HANDLERS ====================
    function init() {
        // Helper to toggle placeholder class
        const togglePlaceholderClass = (el) => {
            if (!el) return;
            if (el.value === '') {
                el.classList.add('placeholder-shown');
            } else {
                el.classList.remove('placeholder-shown');
            }
        };

        // Initialize object selectors as disabled
        handleCompareTypeChange();
        [compareTypeEl, obj1El, obj2El].forEach(togglePlaceholderClass);

        // Tab buttons
        document.querySelectorAll(TAB_BTN_SELECTOR).forEach((btn) =>
            btn.addEventListener('click', function () {
                if (this.dataset.tab === 'result' && this.disabled) {
                    alert(
                        'Vui lòng chọn 2 đối tượng và nhấn "Tìm kiếm & So sánh" trước khi xem kết quả.'
                    );
                    return;
                }
                const tabName = this.dataset.tab;
                document
                    .querySelectorAll(TAB_BTN_SELECTOR)
                    .forEach((b) => b.classList.remove('active'));
                document
                    .querySelectorAll('.tab-content')
                    .forEach((c) => c.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(tabName + '-tab')?.classList.add('active');
            })
        );

        // Compare type change
        compareTypeEl?.addEventListener('change', () => {
            obj1El.value = '';
            obj2El.value = '';
            handleCompareTypeChange();
            updateCompareButtonState();
            togglePlaceholderClass(compareTypeEl);
            togglePlaceholderClass(obj1El);
            togglePlaceholderClass(obj2El);
        });

        // Object selection changes
        obj1El?.addEventListener('change', () => {
            handleCompareTypeChange();
            updateCompareButtonState();
            togglePlaceholderClass(obj1El);
        });
        obj2El?.addEventListener('change', () => {
            handleCompareTypeChange();
            updateCompareButtonState();
            togglePlaceholderClass(obj2El);
        });

        // Action buttons
        compareBtn?.addEventListener('click', performCompare);
        resetBtn?.addEventListener('click', resetAll);

        // Create report button
        createReportBtn?.addEventListener('click', async () => {
            if (!lastComparison)
                return alert('Không có kết quả so sánh — hãy thực hiện so sánh trước.');
            const desc = prompt('Mô tả ngắn cho báo cáo (description):', '');
            if (desc === null) return;
            createReportBtn.disabled = true;
            const payload = buildComparisonPayload(
                lastComparison.type,
                lastComparison.left,
                lastComparison.right,
                desc || ''
            );
            const ok = await saveComparisonReport(payload);
            if (!ok) createReportBtn.disabled = false;
            else
                setTimeout(() => {
                    createReportBtn.disabled = false;
                }, 800);
        });

        // Load initial data
        loadDataFiles();
        loadReports();
    }

    // Bootstrap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
