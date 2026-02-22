(function () {
    const PAGE_SIZE = 10;

    let allActivities = [];
    let filteredActivities = [];
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
        const roleFilter = $('roleFilter')?.value || '';
        const dateFilter = $('dateFilter')?.value || '';

        filteredActivities = allActivities.filter(activity => {
            const matchesSearch = !search || (
                activity.description?.toLowerCase().includes(search) ||
                activity.user?.name?.toLowerCase().includes(search) ||
                activity.user?.email?.toLowerCase().includes(search)
            );
            const matchesRole = !roleFilter || activity.user?.role === roleFilter;
            const matchesDate = !dateFilter || new Date(activity.createdAt).toDateString() === dateFilter;
            return matchesSearch && matchesRole && matchesDate;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function resetFilters() {
        const searchInput = $('searchInput');
        const roleFilter = $('roleFilter');
        const dateFilter = $('dateFilter');
        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        applyFilters();
    }

    function getPageSlice() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
            start,
            end,
            rows: filteredActivities.slice(start, end),
            total: filteredActivities.length,
        };
    }

    function renderTable() {
        const tbody = $('activityLogTableBody');
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

        tbody.innerHTML = page.rows.map(activity => {
            const roleClass = activity.user?.role === 'HOD' ? 'badge-danger' : 
                               activity.user?.role === 'TEACHER' ? 'badge-primary' : 
                               activity.user?.role === 'STUDENT' ? 'badge-success' : 'badge-secondary';

            return `
                <tr>
                    <td>${safeText(formatDate(activity.createdAt))}</td>
                    <td>
                        <div class="user-info">
                            <strong>${safeText(activity.user?.name || 'N/A')}</strong>
                            <small>${safeText(activity.user?.email || 'N/A')}</small>
                        </div>
                    </td>
                    <td><span class="badge ${roleClass}">${safeText(activity.user?.role || 'N/A')}</span></td>
                    <td><span class="badge ${getActionClass(activity.action)}">${safeText(formatAction(activity.action))}</span></td>
                    <td><div class="activity-description">${safeText(activity.description || 'No description')}</div></td>
                    <td><span class="ip-address">${safeText(activity.ipAddress || 'N/A')}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn" onclick="window.activityLogApp.viewActivity(${activity.id})" title="View Details">
                                <i class="fas fa-eye"></i>
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
            info.textContent = total === 0 ? 'No activities' : `Showing ${from}-${to} of ${total}`;
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
                <span id="paginationInfo">${total === 0 ? 'No activities' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.activityLogApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.activityLogApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const response = await hodAPI.getActivityLogs();
            if (response) {
                allActivities = response;
                filteredActivities = response;
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

    function getActionClass(action) {
        const actionMap = {
            'CREATE': 'badge-success',
            'UPDATE': 'badge-warning',
            'DELETE': 'badge-danger',
            'MARK': 'badge-info',
            'UPLOAD': 'badge-primary',
            'ATTEMPT': 'badge-secondary',
            'LOGIN': 'badge-dark',
            'LOGOUT': 'badge-light'
        };
        return actionMap[action] || 'badge-secondary';
    }

    function formatAction(action) {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function viewActivity(id) {
        const activity = allActivities.find(a => a.id === id);
        if (!activity) {
            showToast('Activity not found', 'error');
            return;
        }

        const roleClass = activity.user?.role === 'HOD' ? 'badge-danger' : 
                           activity.user?.role === 'TEACHER' ? 'badge-primary' : 
                           activity.user?.role === 'STUDENT' ? 'badge-success' : 'badge-secondary';

        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Activity Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Date & Time:</strong> ${safeText(formatDateTime(activity.createdAt))}</p>
                        <p><strong>User:</strong> ${safeText(activity.user?.name || 'N/A')}</p>
                        <p><strong>Email:</strong> ${safeText(activity.user?.email || 'N/A')}</p>
                        <p><strong>Role:</strong> <span class="badge ${roleClass}">${safeText(activity.user?.role || 'N/A')}</span></p>
                        <p><strong>Action:</strong> <span class="badge ${getActionClass(activity.action)}">${safeText(formatAction(activity.action))}</span></p>
                        <p><strong>Description:</strong> ${safeText(activity.description || 'No description')}</p>
                        <p><strong>IP Address:</strong> ${safeText(activity.ipAddress || 'N/A')}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    function exportLog() {
        if (allActivities.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const csvContent = [
            ['ID', 'User Name', 'User Email', 'Role', 'Action', 'Description', 'IP Address', 'Date & Time'],
            ...allActivities.map(activity => [
                activity.id,
                activity.user?.name || 'N/A',
                activity.user?.email || 'N/A',
                formatAction(activity.action),
                activity.description || 'No description',
                activity.ipAddress || 'N/A',
                formatDateTime(activity.createdAt)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${formatDate(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('Activity log exported successfully', 'success');
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API
    window.activityLogApp = {
        applyFilters,
        resetFilters,
        refreshData,
        prevPage: () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPagination();
            }
        },
        nextPage: () => {
            const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewActivity,
        exportLog
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
