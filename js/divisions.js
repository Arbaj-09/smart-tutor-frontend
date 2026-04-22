(function () {
    console.log('✅ divisions.js loaded');
    const PAGE_SIZE = 10;

    let allDivisions = [];
    let allClasses = [];
    let filteredDivisions = [];
    let currentPage = 1;
    let editingDivisionId = null;

    function requireHod() {
        // Manual user check (same as other pages)
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.warn("Redirect prevented for demo - divisions.js");
            return null;
        }
        
        let user;
        try {
            user = JSON.parse(userStr);
        } catch (error) {
            console.warn("Redirect prevented for demo - divisions.js parse error");
            return null;
        }
        
        if (!user?.name || !user?.role) {
            console.warn("Redirect prevented for demo - divisions.js");
            return null;
        }
        const role = String(user.role).toUpperCase();
        if (role !== 'HOD') {
            console.warn("Redirect prevented for demo - divisions.js role check");
            return null;
        }
        return { name: user.name, role };
    }

    function $(id) {
        return document.getElementById(id);
    }

    function safeText(v) {
        return String(v ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    // Calculate student count for a division (placeholder for now)
    function getStudentCount(division) {
        // Since backend doesn't provide student count, return placeholder
        // In future, this could be calculated from students API
        return division.studentCount || 'N/A';
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
            total: filteredDivisions.length,
            rows: filteredDivisions.slice(start, end),
        };
    }

    function renderTable() {
        console.log('🎨 renderTable called');
        const tbody = $('divisionsTableBody');
        const skeleton = $('skeletonLoader');
        const wrapper = $('tableWrapper');
        const empty = $('emptyState');
        
        console.log('🔍 divisionsTableBody:', tbody);
        console.log('🔍 skeletonLoader:', skeleton);
        console.log('🔍 tableWrapper:', wrapper);

        if (!tbody) {
            console.error('❌ DOM ID not found: divisionsTableBody');
            return;
        }

        if (skeleton) {
            skeleton.style.display = 'none';
            console.log('🧪 Skeleton hidden:', getComputedStyle(skeleton).display === 'none');
            console.log('🧪 Skeleton pointerEvents:', getComputedStyle(skeleton).pointerEvents);
        }

        if (wrapper) {
            wrapper.style.display = 'block';
            console.log('🧪 Wrapper visible:', getComputedStyle(wrapper).display === 'block');
            console.log('🧪 Wrapper pointerEvents:', getComputedStyle(wrapper).pointerEvents);
        }

        const page = getPageSlice();
        console.log('🧩 Rendering rows:', page.rows.length);
        console.log('➡ Row data sample:', page.rows[0]);

        if (page.total === 0) {
            if (wrapper) wrapper.style.display = 'none';
            if (empty) empty.style.display = 'block';
            updatePaginationInfo(0, 0, 0);
            return;
        }

        if (empty) empty.style.display = 'none';

        tbody.innerHTML = page.rows.map(division => {
            const className = allClasses.find(c => c.id === division.classId)?.className || 'N/A';
            return `
                <tr>
                    <td>${safeText(division.divisionName)}</td>
                    <td><span class="badge badge-primary">${safeText(className)}</span></td>
                    <td>${getStudentCount(division)}</td>
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

        console.log('✅ Table rendered, tbody.children.length:', tbody.children.length);
        updatePaginationInfo(page.start + 1, Math.min(page.end, page.total), page.total);
    }

    function updatePaginationInfo(from, to, total) {
        const info = $('paginationInfo');
        if (info) {
            info.textContent = `Showing ${from}-${to} of ${total} divisions`;
        }
    }

    function renderPagination() {
        const host = $('pagination');
        if (!host) return;

        const { start, end, total } = getPageSlice();
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const from = start + 1;
        const to = Math.min(end, total);

        host.innerHTML = `
            <div class="pagination-left">
                <span id="paginationInfo">${total === 0 ? 'No divisions' : `Showing ${from}-${to} of ${total} divisions`}</span>
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

    async function loadDivisions() {
        console.log('📡 Calling API: Loading divisions...');
        try {
            showLoading();
            
            // Hide skeleton loader if it exists
            const skeleton = document.querySelector('.skeleton-loader');
            if (skeleton) {
                skeleton.style.display = 'none';
            }

            const [classesResponse, divisionsResponse] = await Promise.all([
                hodAPI.getAllClasses(),
                hodAPI.getAllDivisions()
            ]);

            console.log('📥 API response classes:', classesResponse);
            console.log('📥 API response divisions:', divisionsResponse);

            if (classesResponse) {
                allClasses = classesResponse;
                console.log('🧠 allClasses:', allClasses);
                populateClassFilter();
            }

            if (divisionsResponse) {
                allDivisions = divisionsResponse;
                filteredDivisions = divisionsResponse;
                console.log('🧠 allDivisions:', allDivisions);
                console.log('🧠 filteredDivisions:', filteredDivisions);
                if (divisionsResponse.length === 0) {
                    console.warn('⚠️ API returned empty divisions list');
                }
                applyFilters();
            }
        } catch (error) {
            console.error('Load initial data error:', error);
            showError('Failed to load data');
        } finally {
            hideGlobalLoading();
        }
    }

    function openDivisionModal({ mode = 'create', division = null }) {
        const isEdit = mode === 'edit';
        const divisionId = division?.id || '';
        const divisionName = division?.divisionName || '';
        const classId = division?.classId || '';

        const formHtml = `
            <form id="divisionForm">
                <div class="form-group">
                    <label for="divisionName">Division Name *</label>
                    <input type="text" id="divisionName" name="divisionName" class="form-control" value="${safeText(divisionName)}" required placeholder="e.g., A, B, C" maxlength="10" />
                </div>
                <div class="form-group">
                    <label for="classId">Class *</label>
                    <select id="classId" name="classId" class="form-control" required>
                        <option value="">Select Class</option>
                        ${allClasses.map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${safeText(c.className)}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        showModal({
            title: isEdit ? 'Edit Division' : 'Create New Division',
            content: formHtml,
            customActions: `
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="window.divisionsApp.submitDivision()">${isEdit ? 'Update' : 'Create'}</button>
            `
        });

        editingDivisionId = isEdit ? divisionId : null;
    }

    async function submitDivision() {
        const form = document.getElementById('divisionForm');
        if (!form) return;

        const fd = new FormData(form);
        const payload = {
            divisionName: fd.get('divisionName')?.trim(),
            classEntity: { id: Number(fd.get('classId')) }
        };

        if (!payload.divisionName || !payload.classEntity.id) {
            showError('Please fill all required fields');
            return;
        }

        try {
            showGlobalLoading();
            if (editingDivisionId) {
                await hodAPI.updateDivision(editingDivisionId, payload);
                showSuccess('Division updated successfully');
            } else {
                await hodAPI.createDivision(payload);
                showSuccess('Division created successfully');
            }
            closeModal();
            await loadDivisions();
        } catch (err) {
            console.error('Save division error:', err);
            showError(err.message || 'Failed to save division');
        } finally {
            hideGlobalLoading();
        }
    }

    function viewDivision(id) {
        console.log('🖱️ View clicked for ID:', id);
        hideGlobalLoading();
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showError('Division not found');
            return;
        }

        const className = allClasses.find(c => c.id === division.classId)?.className || 'N/A';

        const contentHtml = `
            <p><strong>Division Name:</strong> ${safeText(division.divisionName)}</p>
            <p><strong>Class:</strong> ${safeText(className)}</p>
            <p><strong>Created Date:</strong> ${safeText(formatDate(division.createdAt))}</p>
        `;

        console.log('🪟 Opening modal with data:', division);
        showModal({
            title: 'Division Details',
            content: contentHtml,
            customActions: `
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            `
        });

        console.log('✅ Modal opened');
    }

    function editDivision(id) {
        console.log('🖱️ Edit clicked for ID:', id);
        hideGlobalLoading();
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showError('Division not found');
            return;
        }

        openDivisionModal({ mode: 'edit', division });
    }

    async function deleteDivision(id) {
        console.log('🖱️ Delete clicked for ID:', id);
        hideGlobalLoading();
        const division = allDivisions.find(d => d.id === id);
        if (!division) {
            showError('Division not found');
            return;
        }

        console.log('⚠️ Delete confirmation triggered');
        const confirmed = await showConfirm(`Are you sure you want to delete "${division.divisionName}"? This action cannot be undone.`);

        console.log('🧨 Delete confirmed:', confirmed);
        if (confirmed) {
            try {
                showGlobalLoading();
                await hodAPI.deleteDivision(id);
                showSuccess('Division deleted successfully');
                await loadDivisions();
            } catch (err) {
                console.error('Delete division error:', err);
                showError(err.message || 'Failed to delete division');
            } finally {
                hideGlobalLoading();
            }
        }
    }

    // Pagination functions
    function nextPage() {
        const totalPages = Math.ceil(filteredDivisions.length / PAGE_SIZE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            renderPagination();
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            renderPagination();
        }
    }

    // Expose public functions
    window.divisionsApp = {
        showCreateModal: () => openDivisionModal({ mode: 'create' }),
        viewDivision,
        editDivision,
        deleteDivision,
        submitDivision,
        applyFilters,
        resetFilters,
        refreshData: loadDivisions,
        nextPage,
        prevPage
    };

    console.log('✅ window.divisionsApp exposed:', Object.keys(window.divisionsApp));

    // Initialize
    function init() {
        const user = requireHod();
        if (!user) return;

        loadDivisions();
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
