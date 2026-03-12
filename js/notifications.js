(function () {
    const PAGE_SIZE = 10;

    let allNotifications = [];
    let filteredNotifications = [];
    let currentPage = 1;

    function requireHod() {
        // Manual user check (same as other pages)
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.warn("Redirect prevented for demo - notifications.js");
            return null;
        }
        
        let user;
        try {
            user = JSON.parse(userStr);
        } catch (error) {
            console.warn("Redirect prevented for demo - notifications.js parse error");
            return null;
        }
        
        if (!user?.name || !user?.role) {
            console.warn("Redirect prevented for demo - notifications.js");
            return null;
        }
        const role = String(user.role).toUpperCase();
        // Allow TEACHER, STUDENT, and HOD to access notifications
        if (role !== 'HOD' && role !== 'TEACHER' && role !== 'STUDENT') {
            console.warn("Redirect prevented for demo - notifications.js role check");
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
        const typeFilter = $('typeFilter')?.value || '';

        filteredNotifications = allNotifications.filter(notification => {
            const matchesSearch = !search || (
                notification.title.toLowerCase().includes(search) ||
                notification.message.toLowerCase().includes(search)
            );
            const matchesType = !typeFilter || notification.type === typeFilter;
            return matchesSearch && matchesType;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function resetFilters() {
        const searchInput = $('searchInput');
        const typeFilter = $('typeFilter');
        if (searchInput) searchInput.value = '';
        if (typeFilter) typeFilter.value = '';
        applyFilters();
    }

    function getPageSlice() {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return {
            start,
            end,
            rows: filteredNotifications.slice(start, end),
            total: filteredNotifications.length,
        };
    }

    function renderTable() {
        const tbody = $('notificationsTableBody');
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

        tbody.innerHTML = page.rows.map(notification => {
            const statusBadge = notification.isRead ? 
                '<span class="badge badge-success">Read</span>' : 
                '<span class="badge badge-warning">Unread</span>';

            return `
                <tr>
                    <td>${safeText(formatDate(notification.createdAt))}</td>
                    <td>${safeText(notification.teacherName || '-')}</td>
                    <td>${safeText(notification.subject || '-')}</td>
                    <td><div class="notification-message">${safeText(notification.title)}</div></td>
                    <td>${safeText(notification.className || '-')}</td>
                    <td>${safeText(notification.divisionName || '-')}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn" onclick="window.notificationsApp.viewNotification(${notification.id})" title="View Details">
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
            info.textContent = total === 0 ? 'No notifications' : `Showing ${from}-${to} of ${total}`;
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
                <span id="paginationInfo">${total === 0 ? 'No notifications' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.notificationsApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.notificationsApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    async function loadInitialData() {
        try {
            showLoading();
            hideSkeleton();

            const response = await commonAPI.getNotifications();
            if (response) {
                allNotifications = response;
                filteredNotifications = response;
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

    function getTypeClass(type) {
        const classMap = {
            'INFO': 'badge-info',
            'SUCCESS': 'badge-success',
            'WARNING': 'badge-warning',
            'ERROR': 'badge-danger',
            'QUIZ': 'badge-primary',
            'ATTENDANCE': 'badge-secondary',
            'NOTE': 'badge-dark',
            'SYSTEM': 'badge-light'
        };
        return classMap[type] || 'badge-secondary';
    }

    function getTypeIcon(type) {
        const iconMap = {
            'INFO': 'fa-info-circle',
            'SUCCESS': 'fa-check-circle',
            'WARNING': 'fa-exclamation-triangle',
            'ERROR': 'fa-times-circle',
            'QUIZ': 'fa-question-circle',
            'ATTENDANCE': 'fa-calendar-check',
            'NOTE': 'fa-file-alt',
            'SYSTEM': 'fa-cog'
        };
        return iconMap[type] || 'fa-bell';
    }

    function viewNotification(id) {
        const notification = allNotifications.find(n => n.id === id);
        if (!notification) {
            showToast('Notification not found', 'error');
            return;
        }

        const typeClass = getTypeClass(notification.type);
        const container = $('modalContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target===this) closeModal()">
                <div class="modal modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">Notification Details</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Date & Time:</strong> ${safeText(formatDateTime(notification.createdAt))}</p>
                        <p><strong>Type:</strong> <span class="badge ${typeClass}">${safeText(notification.type)}</span></p>
                        <p><strong>Message:</strong> ${safeText(notification.message)}</p>
                        <p><strong>Status:</strong> ${notification.read ? '<span class="badge badge-success">Read</span>' : '<span class="badge badge-warning">Unread</span>'}</p>
                        ${notification.readAt ? `<p><strong>Read At:</strong> ${safeText(formatDateTime(notification.readAt))}</p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    async function deleteNotification(id) {
        const notification = allNotifications.find(n => n.id === id);
        if (!notification) {
            showToast('Notification not found', 'error');
            return;
        }

        openConfirmModal({
            title: 'Delete Notification',
            message: `Are you sure you want to delete this notification? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    showLoading();
                    await commonAPI.deleteNotification(id);
                    showToast('Notification deleted successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Delete notification error:', err);
                    showToast(err.message || 'Failed to delete notification', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    async function markAllAsRead() {
        const unreadNotifications = allNotifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) {
            showToast('No unread notifications', 'info');
            return;
        }

        openConfirmModal({
            title: 'Mark All as Read',
            message: `Are you sure you want to mark all ${unreadNotifications.length} notifications as read?`,
            confirmText: 'Mark All Read',
            onConfirm: async () => {
                try {
                    showLoading();
                    const markPromises = unreadNotifications.map(n => commonAPI.markNotificationAsRead(n.id));
                    await Promise.all(markPromises);
                    showToast(`Marked ${unreadNotifications.length} notifications as read`, 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Mark all as read error:', err);
                    showToast(err.message || 'Failed to mark notifications as read', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    async function clearAllNotifications() {
        if (allNotifications.length === 0) {
            showToast('No notifications to clear', 'info');
            return;
        }

        openConfirmModal({
            title: 'Clear All Notifications',
            message: `Are you sure you want to clear all ${allNotifications.length} notifications? This action cannot be undone.`,
            confirmText: 'Clear All',
            onConfirm: async () => {
                try {
                    showLoading();
                    await commonAPI.clearAllNotifications();
                    showToast('All notifications cleared successfully', 'success');
                    closeModal();
                    await loadInitialData();
                } catch (err) {
                    console.error('Clear all notifications error:', err);
                    showToast(err.message || 'Failed to clear notifications', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API
    window.notificationsApp = {
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
            const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewNotification,
        deleteNotification,
        markAllAsRead,
        clearAllNotifications
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
