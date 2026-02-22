(function () {
    const PAGE_SIZE = 10;

    let allStudents = [];
    let allClasses = [];
    let allDivisions = [];
    let allTeachers = [];
    let filteredStudents = [];
    let currentPage = 1;

    function requireHod() {
        const user = getCurrentUser();
        if (!user?.name || !user?.role) {
            window.location.href = '/index.html';
            return null;
        }
        const role = String(user.role).toUpperCase();
        if (role !== 'HOD') {
            window.location.href = '/index.html';
            return null;
        }
        return { name: user.name, role };
    }

    function $(id) {
        return document.getElementById(id);
    }

    function showSkeleton() {
        const skeleton = $('skeletonLoader');
        if (skeleton) skeleton.style.display = '';
    }

    function hideSkeleton() {
        const skeleton = $('skeletonLoader');
        if (skeleton) skeleton.style.display = 'none';
    }

    function safeText(v) {
        return String(v ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    function applyFilters() {
        const search = ($('searchInput')?.value || '').trim().toLowerCase();
        const classId = $('classFilter')?.value || '';
        const divisionId = $('divisionFilter')?.value || '';

        filteredStudents = allStudents.filter(s => {
            const matchSearch = !search || (
                s.name.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search) ||
                (s.rollNumber && s.rollNumber.toLowerCase().includes(search))
            );
            const matchClass = !classId || s.classId == classId;
            const matchDivision = !divisionId || s.divisionId == divisionId;
            return matchSearch && matchClass && matchDivision;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function resetFilters() {
        const searchInput = $('searchInput');
        const classFilter = $('classFilter');
        const divisionFilter = $('divisionFilter');
        if (searchInput) searchInput.value = '';
        if (classFilter) classFilter.value = '';
        if (divisionFilter) divisionFilter.value = '';
        applyFilters();
    }

    function getPageSlice() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
            start,
            end,
            rows: filteredStudents.slice(start, end),
            total: filteredStudents.length,
        };
    }

    function renderTable() {
        const tbody = $('studentsTableBody');
        const wrapper = $('tableWrapper');
        const empty = $('emptyState');
        if (!tbody) return;

        const page = getPageSlice();

        if (page.total === 0) {
            tbody.innerHTML = '';
            if (wrapper) wrapper.style.display = 'none';
            if (empty) empty.style.display = 'block';
            updatePaginationInfo(0, 0, 0);
            return;
        }

        if (wrapper) wrapper.style.display = 'block';
        if (empty) empty.style.display = 'none';

        tbody.innerHTML = page.rows.map(student => {
            const className = allClasses.find(c => c.id === student.classId)?.className || 'N/A';
            const divisionName = allDivisions.find(d => d.id === student.divisionId)?.divisionName || 'N/A';
            const teacherName = allTeachers.find(t => t.id === student.teacherId)?.name || 'N/A';
            return `
                <tr>
                    <td>${safeText(student.name)}</td>
                    <td><a href="mailto:${safeText(student.email)}" class="email-link">${safeText(student.email)}</a></td>
                    <td><span class="badge badge-primary">${safeText(className)}</span></td>
                    <td><span class="badge badge-secondary">${safeText(divisionName)}</span></td>
                    <td>${safeText(formatDate(student.createdAt))}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn" onclick="window.studentsApp.viewStudent(${student.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="icon-btn" onclick="window.studentsApp.editStudent(${student.id})" title="Edit Student">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn danger" onclick="window.studentsApp.deleteStudent(${student.id})" title="Delete Student">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationInfo(page.start + 1, Math.min(page.end, page.total), page.total);
    }

    function updatePaginationInfo(from, to, total) {
        const info = $('paginationInfo');
        if (info) {
            info.textContent = total === 0 ? 'No students' : `Showing ${from}-${to} of ${total}`;
        }
    }

    function renderPagination() {
        const host = $('pagination');
        if (!host) return;

        const { start, end, total } = getPageSlice();
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

        const from = total === 0 ? 0 : start + 1;
        const to = Math.min(end, total);

        host.innerHTML = `
            <div class="pagination-left">
                <span id="paginationInfo">${total === 0 ? 'No students' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.studentsApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.studentsApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    function populateFilters() {
        const classFilter = $('classFilter');
        if (classFilter && allClasses) {
            classFilter.innerHTML = '<option value="">All Classes</option>' + 
                allClasses.map(c => `<option value="${c.id}">${safeText(c.className)}</option>`).join('');
        }

        const divisionFilter = $('divisionFilter');
        if (divisionFilter && allDivisions) {
            divisionFilter.innerHTML = '<option value="">All Divisions</option>' + 
                allDivisions.map(d => `<option value="${d.id}">${safeText(d.divisionName)}</option>`).join('');
        }
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const [studentsResponse, classesResponse, divisionsResponse, teachersResponse] = await Promise.all([
                hodAPI.getAllStudents(),
                commonAPI.getClasses(),
                commonAPI.getDivisions(),
                commonAPI.getTeachers()
            ]);

            if (studentsResponse) {
                allStudents = studentsResponse;
                filteredStudents = studentsResponse;
            }

            if (classesResponse) {
                allClasses = classesResponse;
            }

            if (divisionsResponse) {
                allDivisions = divisionsResponse;
            }

            if (teachersResponse) {
                allTeachers = teachersResponse;
            }

            populateFilters();
            applyFilters();
        } catch (error) {
            console.error('Load initial data error:', error);
            showToast('Failed to load data', 'error');
        } finally {
            hideLoading();
            hideSkeleton();
        }
    }

    function closeModal() {
        const container = $('modalContainer');
        if (container) container.innerHTML = '';
    }

    function openConfirmModal({ title, message, confirmText, onConfirm }) {
        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${safeText(title)}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="confirm-message">${safeText(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="handleConfirm()">${safeText(confirmText)}</button>
                    </div>
                </div>
            </div>
        `;

        window.handleConfirm = async () => {
            await onConfirm();
        };
    }

    function openStudentModal({ mode = 'create', student = null }) {
        const container = $('modalContainer');
        if (!container) return;

        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Student' : 'Add Student';

        const name = student?.name || '';
        const rollNumber = student?.rollNumber || '';
        const email = student?.email || '';
        const classId = student?.classId || '';
        const divisionId = student?.divisionId || '';
        const teacherId = student?.teacherId || '';

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="studentForm" onsubmit="handleStudentSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="studentName">Full Name</label>
                                <input type="text" id="studentName" name="name" class="form-control" value="${safeText(name)}" required placeholder="Enter full name" maxlength="100" />
                            </div>
                            <div class="form-group">
                                <label for="rollNumber">Roll Number</label>
                                <input type="text" id="rollNumber" name="rollNumber" class="form-control" value="${safeText(rollNumber)}" required placeholder="Enter roll number" maxlength="20" />
                            </div>
                            <div class="form-group">
                                <label for="studentEmail">Email Address</label>
                                <input type="email" id="studentEmail" name="email" class="form-control" value="${safeText(email)}" required placeholder="Enter email address" maxlength="100" />
                            </div>
                            <div class="form-group">
                                <label for="classId">Class</label>
                                <select id="classId" name="classId" class="form-control form-select" required>
                                    <option value="">Select Class</option>
                                    ${allClasses.map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${safeText(c.className)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="divisionId">Division</label>
                                <select id="divisionId" name="divisionId" class="form-control form-select" required>
                                    <option value="">Select Division</option>
                                    ${allDivisions.map(d => `<option value="${d.id}" ${d.id == divisionId ? 'selected' : ''}>${safeText(d.divisionName)}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        window.handleStudentSubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {
                name: fd.get('name')?.trim(),
                rollNumber: fd.get('rollNumber')?.trim(),
                email: fd.get('email')?.trim(),
                classId: Number(fd.get('classId')),
                divisionId: Number(fd.get('divisionId')),
                teacherId: Number(fd.get('teacherId'))
            };

            if (!payload.name || !payload.rollNumber || !payload.email || !payload.classId || !payload.divisionId || !payload.teacherId) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            try {
                showLoading();
                if (isEdit) {
                    await hodAPI.updateStudent(student.id, payload);
                    showToast('Student updated successfully', 'success');
                } else {
                    await hodAPI.createStudent(payload);
                    showToast('Student created successfully', 'success');
                }
                closeModal();
                await loadInitialData();
            } catch (err) {
                console.error('Save student error:', err);
                showToast(err.message || 'Failed to save student', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    function viewStudent(id) {
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }

        const className = allClasses.find(c => c.id === student.classId)?.className || 'N/A';
        const divisionName = allDivisions.find(d => d.id === student.divisionId)?.divisionName || 'N/A';
        const teacherName = allTeachers.find(t => t.id === student.teacherId)?.name || 'N/A';

        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Student Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Full Name:</strong> ${safeText(student.name)}</p>
                        <p><strong>Roll Number:</strong> ${safeText(student.rollNumber)}</p>
                        <p><strong>Email:</strong> ${safeText(student.email)}</p>
                        <p><strong>Class:</strong> ${safeText(className)}</p>
                        <p><strong>Division:</strong> ${safeText(divisionName)}</p>
                        <p><strong>Teacher:</strong> ${safeText(teacherName)}</p>
                        <p><strong>Created Date:</strong> ${safeText(formatDate(student.createdAt))}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    function editStudent(id) {
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        openStudentModal({ mode: 'edit', student });
    }

    async function deleteStudent(id) {
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }

        openConfirmModal({
            title: 'Delete Student',
            message: `Are you sure you want to delete <strong>${safeText(student.name)}</strong>? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    showLoading();
                    await hodAPI.deleteStudent(id);
                    showToast('Student deleted successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Delete student error:', err);
                    showToast(err.message || 'Failed to delete student', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function showCreateModal() {
        openStudentModal({ mode: 'create' });
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API
    window.studentsApp = {
        applyFilters,
        resetFilters,
        showCreateModal,
        refreshData,
        prevPage: () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPagination();
            }
        },
        nextPage: () => {
            const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewStudent,
        editStudent,
        deleteStudent
    };

    // Initialize
    function init() {
        const user = requireHod();
        if (!user) return;

        showSkeleton();
        loadInitialData();
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
