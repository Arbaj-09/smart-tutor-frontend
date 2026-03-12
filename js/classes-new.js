// ===== CLASSES MANAGEMENT =====

(function() {
    const PAGE_SIZE = 10;
    
    let allClasses = [];
    let filteredClasses = [];
    let currentPage = 1;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadClasses();
        setupEventListeners();
    });

    function setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
    }

    async function loadClasses() {
        try {
            const classes = await api.hod.classes.getAll();
            allClasses = classes || [];
            filteredClasses = [...allClasses];
            renderTable();
        } catch (error) {
            console.error('Failed to load classes:', error);
            showError('Failed to load classes');
            renderEmptyState();
        }
    }

    function handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filteredClasses = allClasses.filter(cls => 
            cls.className.toLowerCase().includes(searchTerm) ||
            (cls.description && cls.description.toLowerCase().includes(searchTerm))
        );
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const tbody = document.getElementById('classesTableBody');
        if (!tbody) return;
        
        const total = filteredClasses.length;
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, total);
        const pageData = filteredClasses.slice(start, end);

        if (total === 0) {
            renderEmptyState();
            return;
        }

        tbody.innerHTML = pageData.map(cls => `
            <tr>
                <td>
                    <div class="class-info">
                        <div class="class-icon">
                            <i class="fas fa-chalkboard"></i>
                        </div>
                        <div class="class-details">
                            <div class="class-name">${escapeHtml(cls.className)}</div>
                            <div class="class-description">${escapeHtml(cls.description || 'No description')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${cls.active ? 'status-active' : 'status-inactive'}">
                        ${cls.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${dateUtils.formatDate(cls.createdAt)}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="viewClass(${cls.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editClass(${cls.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClass(${cls.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        updatePagination(start, end, total);
    }

    function renderEmptyState() {
        const tbody = document.getElementById('classesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-chalkboard"></i>
                        </div>
                        <div class="empty-state-title">No classes found</div>
                        <div class="empty-state-description">
                            Get started by adding your first class.
                        </div>
                        <button class="btn btn-primary" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i>
                            Add Class
                        </button>
                    </div>
                </td>
            </tr>
        `;
        updatePagination(0, 0, 0);
    }

    function updatePagination(start, end, total) {
        const startEl = document.getElementById('paginationStart');
        const endEl = document.getElementById('paginationEnd');
        const totalEl = document.getElementById('paginationTotal');
        const controlsEl = document.getElementById('paginationControls');
        
        if (startEl) startEl.textContent = total > 0 ? start + 1 : 0;
        if (endEl) endEl.textContent = end;
        if (totalEl) totalEl.textContent = total;

        const totalPages = Math.ceil(total / PAGE_SIZE);
        
        if (!controlsEl || totalPages <= 1) {
            if (controlsEl) controlsEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="btn btn-sm btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" onclick="goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += '<span class="pagination-dots">...</span>';
            }
        }

        // Next button
        paginationHTML += `
            <button class="btn btn-sm btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        controlsEl.innerHTML = paginationHTML;
    }

    function goToPage(page) {
        currentPage = page;
        renderTable();
    }

    // Modal functions
    window.showCreateModal = function() {
        const content = `
            <form id="createClassForm" class="form-section">
                <div class="form-group">
                    <label for="className">Class Name *</label>
                    <input type="text" id="className" name="className" required>
                    <span class="error-message" id="classNameError"></span>
                </div>
                <div class="form-group">
                    <label for="classDescription">Description</label>
                    <textarea id="classDescription" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="classActive">Status</label>
                    <select id="classActive" name="active">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </form>
        `;

        showModal({
            title: 'Add New Class',
            content,
            size: 'medium'
        });

        setTimeout(() => {
            const form = document.getElementById('createClassForm');
            if (form) {
                form.addEventListener('submit', handleCreateClass);
            }
        }, 100);
    };

    async function handleCreateClass(e) {
        e.preventDefault();
        
        if (!validateClassForm('createClassForm')) {
            return;
        }

        const formData = new FormData(e.target);
        const classData = {
            className: formData.get('className').trim(),
            description: formData.get('description').trim(),
            active: formData.get('active') === 'true'
        };

        try {
            await api.hod.classes.create(classData);
            closeModal();
            showSuccess('Class created successfully');
            loadClasses();
        } catch (error) {
            showError('Failed to create class: ' + error.message);
        }
    }

    function validateClassForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const formData = new FormData(form);
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Class name validation
        if (!formData.get('className').trim()) {
            const classNameError = document.getElementById('classNameError');
            if (classNameError) classNameError.textContent = 'Class name is required';
            isValid = false;
        }

        return isValid;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // CRUD operations
    window.viewClass = function(id) {
        showInfo('View class functionality coming soon');
    };

    window.editClass = function(id) {
        showInfo('Edit class functionality coming soon');
    };

    window.deleteClass = async function(id) {
        const confirmed = await showConfirm({
            title: 'Delete Class',
            message: 'Are you sure you want to delete this class? This action cannot be undone.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });

        if (confirmed) {
            try {
                await api.hod.classes.delete(id);
                showSuccess('Class deleted successfully');
                loadClasses();
            } catch (error) {
                showError('Failed to delete class: ' + error.message);
            }
        }
    };

    // Filter functions
    window.resetFilters = function() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        filteredClasses = [...allClasses];
        currentPage = 1;
        renderTable();
    };

})();
