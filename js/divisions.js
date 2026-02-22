(function () {
    const PAGE_SIZE = 10;

    let allDivisions = [];
    let allClasses = [];
    let filteredDivisions = [];
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

        filteredDivisions = allDivisions.filter(d => {
            const matchSearch = !search || d.divisionName.toLowerCase().includes(search);
            const matchClass = !classId || d.classId == classId;
            return matchSearch && matchClass;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function resetFilters() {
        const searchInput = $('searchInput');
        const classFilter = $('classFilter');
        if (searchInput) searchInput.value = '';
        if (classFilter) classFilter.value = '';
        applyFilters();
    }

    function getPageSlice() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
            start,
            end,
            rows: filteredDivisions.slice(start, end),
            total: filteredDivisions.length,
        };
    }

    function renderTable() {
        const tbody = $('divisionsTableBody');
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

        tbody.innerHTML = page.rows.map(division => {
            const className = allClasses.find(c => c.id === division.classId)?.className || 'N/A';
            return `
                <tr>
                    <td>${safeText(division.divisionName)}</td>
                    <td><span class="badge badge-primary">${safeText(className)}</span></td>
                    <td><span class="badge badge-success">${division.studentCount || 0}</span></td>
                    <td>${safeText(formatDate(division.createdAt))}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn" onclick="window.divisionsApp.viewDivision(${division.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="icon-btn" onclick="window.divisionsApp.editDivision(${division.id})" title="Edit Division">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn danger" onclick="window.divisionsApp.deleteDivision(${division.id})" title="Delete Division">
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
            info.textContent = total === 0 ? 'No divisions' : `Showing ${from}-${to} of ${total}`;
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
                <span id="paginationInfo">${total === 0 ? 'No divisions' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.divisionsApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.divisionsApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    function populateClassFilter() {
        const classFilter = $('classFilter');
        if (classFilter && allClasses) {
            classFilter.innerHTML = '<option value="">All Classes</option>' + 
                allClasses.map(c => `<option value="${c.id}">${safeText(c.className)}</option>`).join('');
        }
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const [classesResponse, divisionsResponse] = await Promise.all([
                commonAPI.getClasses(),
                commonAPI.getDivisions()
            ]);

            if (classesResponse) {
                allClasses = classesResponse;
                populateClassFilter();
            }

            if (divisionsResponse) {
                allDivisions = divisionsResponse;
                filteredDivisions = divisionsResponse;
                applyFilters();
            }
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

    function openDivisionModal({ mode = 'create', division = null }) {
        const container = $('modalContainer');
        if (!container) return;

        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Division' : 'Add Division';

        const divisionName = division?.divisionName || '';
        const classId = division?.classId || '';

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="divisionForm" onsubmit="handleDivisionSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="divisionName">Division Name</label>
                                <input type="text" id="divisionName" name="divisionName" class="form-control" value="${safeText(divisionName)}" required placeholder="e.g., A, B, C" maxlength="10" />
                            </div>
                            <div class="form-group">
                                <label for="classId">Class</label>
                                <select id="classId" name="classId" class="form-control form-select" required>
                                    <option value="">Select Class</option>
                                    ${allClasses.map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${safeText(c.className)}</option>`).join('')}
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

        window.handleDivisionSubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {
                divisionName: fd.get('divisionName')?.trim(),
                classId: Number(fd.get('classId')),
            };

            if (!payload.divisionName || !payload.classId) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            try {
                showLoading();
                if (isEdit) {
                    await commonAPI.updateDivision(division.id, payload);
                    showToast('Division updated successfully', 'success');
                } else {
                    await commonAPI.createDivision(payload);
                    showToast('Division created successfully', 'success');
                }
                closeModal();
                await loadInitialData();
            } catch (err) {
                console.error('Save division error:', err);
                showToast(err.message || 'Failed to save division', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    function viewDivision(id) {
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showToast('Division not found', 'error');
            return;
        }

        const className = allClasses.find(c => c.id === division.classId)?.className || 'N/A';

        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Division Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Division Name:</strong> ${safeText(division.divisionName)}</p>
                        <p><strong>Class:</strong> ${safeText(className)}</p>
                        <p><strong>Student Count:</strong> ${division.studentCount || 0}</p>
                        <p><strong>Created Date:</strong> ${safeText(formatDate(division.createdAt))}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    function editDivision(id) {
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showToast('Division not found', 'error');
            return;
        }
        openDivisionModal({ mode: 'edit', division });
    }

    async function deleteDivision(id) {
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showToast('Division not found', 'error');
            return;
        }

        openConfirmModal({
            title: 'Delete Division',
            message: `Are you sure you want to delete <strong>${safeText(division.divisionName)}</strong>? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    showLoading();
                    await commonAPI.deleteDivision(id);
                    showToast('Division deleted successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Delete division error:', err);
                    showToast(err.message || 'Failed to delete division', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function showCreateModal() {
        openDivisionModal({ mode: 'create' });
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API
    window.divisionsApp = {
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
            const totalPages = Math.max(1, Math.ceil(filteredDivisions.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewDivision,
        editDivision,
        deleteDivision
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
