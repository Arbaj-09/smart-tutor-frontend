(function () {
    const PAGE_SIZE = 10;

    let allClasses = [];
    let filteredClasses = [];
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

        filteredClasses = allClasses.filter(c => {
            const matchSearch = !search || c.className.toLowerCase().includes(search);
            return matchSearch;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function resetFilters() {
        const searchInput = $('searchInput');
        if (searchInput) searchInput.value = '';
        applyFilters();
    }

    function getPageSlice() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
            start,
            end,
            rows: filteredClasses.slice(start, end),
            total: filteredClasses.length,
        };
    }

    function renderTable() {
        const tbody = $('classesTableBody');
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

        tbody.innerHTML = page.rows.map(cls => `
            <tr>
                <td>${safeText(cls.className)}</td>
                <td><span class="badge badge-primary">${cls.studentCount || 0}</span></td>
                <td><span class="badge badge-secondary">${cls.teacherCount || 0}</span></td>
                <td>${safeText(formatDate(cls.createdAt))}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" onclick="window.classesApp.viewClass(${cls.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="icon-btn" onclick="window.classesApp.editClass(${cls.id})" title="Edit Class">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger" onclick="window.classesApp.deleteClass(${cls.id})" title="Delete Class">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        updatePaginationInfo(page.start + 1, Math.min(page.end, page.total), page.total);
    }

    function updatePaginationInfo(from, to, total) {
        const info = $('paginationInfo');
        if (info) {
            info.textContent = total === 0 ? 'No classes' : `Showing ${from}-${to} of ${total}`;
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
                <span id="paginationInfo">${total === 0 ? 'No classes' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.classesApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.classesApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const response = await commonAPI.getClasses();
            if (response) {
                allClasses = response;
                filteredClasses = response;
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

    function openClassModal({ mode = 'create', cls = null }) {
        const container = $('modalContainer');
        if (!container) return;

        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Class' : 'Add Class';

        const className = cls?.className || '';

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="classForm" onsubmit="handleClassSubmit(event)">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="className">Class Name</label>
                                <input type="text" id="className" name="className" class="form-control" value="${safeText(className)}" required placeholder="e.g., FY, SY, TY" maxlength="10" />
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

        window.handleClassSubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {
                className: fd.get('className')?.trim(),
            };

            if (!payload.className) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            try {
                showLoading();
                if (isEdit) {
                    await commonAPI.updateClass(cls.id, payload);
                    showToast('Class updated successfully', 'success');
                } else {
                    await commonAPI.createClass(payload);
                    showToast('Class created successfully', 'success');
                }
                closeModal();
                await loadInitialData();
            } catch (err) {
                console.error('Save class error:', err);
                showToast(err.message || 'Failed to save class', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    function viewClass(id) {
        const cls = allClasses.find(c => c.id === id);
        if (!cls) {
            showToast('Class not found', 'error');
            return;
        }

        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Class Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Class Name:</strong> ${safeText(cls.className)}</p>
                        <p><strong>Student Count:</strong> ${cls.studentCount || 0}</p>
                        <p><strong>Teacher Count:</strong> ${cls.teacherCount || 0}</p>
                        <p><strong>Created Date:</strong> ${safeText(formatDate(cls.createdAt))}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    function editClass(id) {
        const cls = allClasses.find(c => c.id === id);
        if (!cls) {
            showToast('Class not found', 'error');
            return;
        }
        openClassModal({ mode: 'edit', cls });
    }

    async function deleteClass(id) {
        const cls = allClasses.find(c => c.id === id);
        if (!cls) {
            showToast('Class not found', 'error');
            return;
        }

        openConfirmModal({
            title: 'Delete Class',
            message: `Are you sure you want to delete <strong>${safeText(cls.className)}</strong>? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    showLoading();
                    await commonAPI.deleteClass(id);
                    showToast('Class deleted successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Delete class error:', err);
                    showToast(err.message || 'Failed to delete class', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function showCreateModal() {
        openClassModal({ mode: 'create' });
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API
    window.classesApp = {
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
            const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewClass,
        editClass,
        deleteClass
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
