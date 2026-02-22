(function () {
    const PAGE_SIZE = 10;

    let allTeachers = [];
    let filteredTeachers = [];
    let classesData = [];
    let divisionsData = [];

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

    function formatDate(value) {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString();
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const [teachersResponse, classesResponse, divisionsResponse] = await Promise.all([
                hodAPI.getAllTeachers(),
                commonAPI.getClasses(),
                commonAPI.getDivisions()
            ]);

            if (teachersResponse) {
                allTeachers = teachersResponse;
                filteredTeachers = teachersResponse;
            }

            if (classesResponse) {
                classesData = classesResponse;
            }

            if (divisionsResponse) {
                divisionsData = divisionsResponse;
            }

            populateFilters();
            renderTable();
            renderPagination();
        } catch (error) {
            console.error('Load initial data error:', error);
            showToast('Failed to load data', 'error');
        } finally {
            hideLoading();
            hideSkeleton();
        }
    }

    function populateFilters() {
        const classFilter = $('classFilter');
        if (classFilter && classesData) {
            classFilter.innerHTML = '<option value="">All Classes</option>' +
                classesData.map(c => `<option value="${c.id}">${safeText(c.className)}</option>`).join('');
        }

        const divisionFilter = $('divisionFilter');
        if (divisionFilter && divisionsData) {
            divisionFilter.innerHTML = '<option value="">All Divisions</option>' +
                divisionsData.map(d => `<option value="${d.id}">${safeText(d.divisionName)}</option>`).join('');
        }
    }

    function applyFilters() {
        const search = ($('searchInput')?.value || '').trim().toLowerCase();
        const classId = $('classFilter')?.value || '';
        const divisionId = $('divisionFilter')?.value || '';

        filteredTeachers = allTeachers.filter((t) => {
            const name = String(t?.name || '').toLowerCase();
            const email = String(t?.email || '').toLowerCase();

            const matchesSearch = !search || name.includes(search) || email.includes(search);
            const matchesClass = !classId || String(t?.classId ?? '') === String(classId);
            const matchesDivision = !divisionId || String(t?.divisionId ?? '') === String(divisionId);

            return matchesSearch && matchesClass && matchesDivision;
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
            rows: filteredTeachers.slice(start, end),
            total: filteredTeachers.length,
        };
    }

    function renderTable() {
        const tbody = document.getElementById('teachersTableBody');
        const wrapper = document.getElementById('tableWrapper');
        const empty = document.getElementById('emptyState');
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
        updatePaginationInfo(page.start, page.end, page.total);

        tbody.innerHTML = page.rows.map(teacher => `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name">${safeText(teacher.name)}</div>
                            <div class="user-email">${safeText(teacher.email)}</div>
                        </div>
                    </div>
                </td>
                <td>${safeText(teacher.phone)}</td>
                <td>${safeText(teacher.subject)}</td>
                <td>
                    <span class="status-badge ${teacher.active ? 'status-active' : 'status-inactive'}">
                        ${teacher.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${formatDate(teacher.createdAt)}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="viewTeacher(${teacher.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        updatePaginationInfo(page.start + 1, Math.min(page.end, page.total), page.total);
    }

    function updatePaginationInfo(from, to, total) {
        const info = document.getElementById('paginationInfo');
        if (info) {
            info.textContent = total === 0 ? 'No teachers' : `Showing ${from}-${to} of ${total}`;
        }
    }

    function renderPagination() {
        const host = document.getElementById('pagination');
        if (!host) return;

        const { start, end, total } = getPageSlice();
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const currentPage = Math.ceil(end / PAGE_SIZE);

        host.innerHTML = `
            <div class="pagination-left">
                <span id="paginationInfo">${total === 0 ? 'No teachers' : `Showing ${start + 1}-${end} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.teachersApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.teachersApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
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
                        <p class="confirm-message">${message}</p>
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

    function openTeacherModal({ mode = 'create', teacher = null }) {
        const container = $('modalContainer');
        if (!container) return;

        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Teacher' : 'Add Teacher';

        const name = teacher?.name || '';
        const email = teacher?.email || '';
        const classId = teacher?.classId || '';
        const divisionId = teacher?.divisionId || '';

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="teacherForm" onsubmit="handleTeacherSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="teacherName">Full Name <span style="color: red;">*</span></label>
                                <input type="text" id="teacherName" name="name" class="form-control" value="${safeText(name)}" required placeholder="Enter full name" maxlength="100" />
                            </div>
                            <div class="form-group">
                                <label for="teacherEmail">Email Address <span style="color: red;">*</span></label>
                                <input type="email" id="teacherEmail" name="email" class="form-control" value="${safeText(email)}" required placeholder="Enter email address" maxlength="100" />
                            </div>
                            <div class="form-group">
                                <label for="classId">Class <span style="color: red;">*</span></label>
                                <select id="classId" name="classId" class="form-control form-select" required>
                                    <option value="">Select Class</option>
                                    ${classesData.map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${safeText(c.className)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="divisionId">Division <span style="color: red;">*</span></label>
                                <select id="divisionId" name="divisionId" class="form-control form-select" required>
                                    <option value="">Select Division</option>
                                    ${divisionsData.map(d => `<option value="${d.id}" ${d.id == divisionId ? 'selected' : ''}>${safeText(d.divisionName)}</option>`).join('')}
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

        window.handleTeacherSubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {
                name: fd.get('name')?.trim(),
                email: fd.get('email')?.trim(),
                classId: Number(fd.get('classId')),
                divisionId: Number(fd.get('divisionId')),
            };

            if (!payload.name || !payload.email || !payload.classId || !payload.divisionId) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            try {
                showLoading();
                if (isEdit) {
                    await hodAPI.updateTeacher(teacher.id, payload);
                    showToast('Teacher updated successfully', 'success');
                } else {
                    await hodAPI.createTeacher(payload);
                    showToast('Teacher created successfully', 'success');
                }
                closeModal();
                await loadInitialData();
            } catch (err) {
                console.error('Save teacher error:', err);
                showToast(err.message || 'Failed to save teacher', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    function viewTeacher(id) {
        const teacher = allTeachers.find(t => t.id === id);
        if (!teacher) {
            showToast('Teacher not found', 'error');
            return;
        }

        const className = classesData.find(c => c.id === teacher.classId)?.className || 'N/A';
        const divisionName = divisionsData.find(d => d.id === teacher.divisionId)?.divisionName || 'N/A';

        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Teacher Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Full Name:</strong> ${safeText(teacher.name)}</p>
                        <p><strong>Email:</strong> ${safeText(teacher.email)}</p>
                        <p><strong>Class:</strong> ${safeText(className)}</p>
                        <p><strong>Division:</strong> ${safeText(divisionName)}</p>
                        <p><strong>Created Date:</strong> ${safeText(formatDate(teacher.createdAt))}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    function editTeacher(id) {
        const teacher = allTeachers.find(t => t.id === id);
        if (!teacher) {
            showToast('Teacher not found', 'error');
            return;
        }
        openTeacherModal({ mode: 'edit', teacher });
    }

    async function deleteTeacher(id) {
        const teacher = allTeachers.find(t => t.id === id);
        if (!teacher) {
            showToast('Teacher not found', 'error');
            return;
        }

        openConfirmModal({
            title: 'Delete Teacher',
            message: `Are you sure you want to delete <strong>${safeText(teacher.name)}</strong>? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    showLoading();
                    await hodAPI.deleteTeacher(id);
                    showToast('Teacher deleted successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Delete teacher error:', err);
                    showToast(err.message || 'Failed to delete teacher', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function showCreateModal() {
        openTeacherModal({ mode: 'create' });
    }

    function refreshData() {
        loadInitialData();
    }

    function render() {
        renderTable();
        renderPagination();
    }

    // Expose public API
    window.teachersApp = {
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
            const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewTeacher,
        editTeacher,
        deleteTeacher
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
