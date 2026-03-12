// ===== TEACHERS MANAGEMENT =====

(function() {
    const PAGE_SIZE = 10;
    
    let allTeachers = [];
    let filteredTeachers = [];
    let classesData = [];
    let currentPage = 1;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadTeachers();
        loadClasses();
        setupEventListeners();
    });

    function setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        // Class filter
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', handleFilter);
        }
    }

    async function loadTeachers() {
        try {
            const teachers = await api.hod.teachers.getAll();
            allTeachers = teachers || [];
            filteredTeachers = [...allTeachers];
            renderTable();
        } catch (error) {
            console.error('Failed to load teachers:', error);
            showError('Failed to load teachers');
            renderEmptyState();
        }
    }

    async function loadClasses() {
        try {
            const classes = await api.hod.classes.getAll();
            const classFilter = document.getElementById('classFilter');
            if (classFilter) {
                classFilter.innerHTML = '<option value="">All Classes</option>';
                
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.className;
                    classFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    }

    function handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filteredTeachers = allTeachers.filter(teacher => 
            teacher.name.toLowerCase().includes(searchTerm) ||
            teacher.email.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderTable();
    }

    function handleFilter() {
        const classId = document.getElementById('classFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        filteredTeachers = allTeachers.filter(teacher => {
            const matchesSearch = !searchTerm || 
                teacher.name.toLowerCase().includes(searchTerm) ||
                teacher.email.toLowerCase().includes(searchTerm);
            
            const matchesClass = !classId || teacher.classId == classId;
            
            return matchesSearch && matchesClass;
        });
        
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const tbody = document.getElementById('teachersTableBody');
        if (!tbody) return;
        
        const total = filteredTeachers.length;
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, total);
        const pageData = filteredTeachers.slice(start, end);

        if (total === 0) {
            renderEmptyState();
            return;
        }

        tbody.innerHTML = pageData.map(teacher => `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name">${escapeHtml(teacher.name)}</div>
                            <div class="user-email">${escapeHtml(teacher.email)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(teacher.phone || 'N/A')}</td>
                <td>${escapeHtml(teacher.subject || 'N/A')}</td>
                <td>
                    <span class="status-badge ${teacher.active ? 'status-active' : 'status-inactive'}">
                        ${teacher.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${dateUtils.formatDate(teacher.createdAt)}</td>
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

        updatePagination(start, end, total);
    }

    function renderEmptyState() {
        const tbody = document.getElementById('teachersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="empty-state-title">No teachers found</div>
                        <div class="empty-state-description">
                            Get started by adding your first teacher.
                        </div>
                        <button class="btn btn-primary" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i>
                            Add Teacher
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
            <form id="createTeacherForm" class="form-section">
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherName">Name *</label>
                        <input type="text" id="teacherName" name="name" required>
                        <span class="error-message" id="nameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherEmail">Email *</label>
                        <input type="email" id="teacherEmail" name="email" required>
                        <span class="error-message" id="emailError"></span>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherPhone">Phone</label>
                        <input type="tel" id="teacherPhone" name="phone">
                    </div>
                    <div class="form-group">
                        <label for="teacherSubject">Subject</label>
                        <input type="text" id="teacherSubject" name="subject">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherPassword">Password *</label>
                        <input type="password" id="teacherPassword" name="password" required>
                        <span class="error-message" id="passwordError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherActive">Status</label>
                        <select id="teacherActive" name="active">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        showModal({
            title: 'Add New Teacher',
            content,
            size: 'medium'
        });

        setTimeout(() => {
            const form = document.getElementById('createTeacherForm');
            if (form) {
                form.addEventListener('submit', handleCreateTeacher);
            }
        }, 100);
    };

    async function handleCreateTeacher(e) {
        e.preventDefault();
        
        if (!validateTeacherForm('createTeacherForm')) {
            return;
        }

        const formData = new FormData(e.target);
        const teacherData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            subject: formData.get('subject').trim(),
            password: formData.get('password'),
            active: formData.get('active') === 'true'
        };

        try {
            await api.hod.teachers.create(teacherData);
            closeModal();
            showSuccess('Teacher created successfully');
            loadTeachers();
        } catch (error) {
            showError('Failed to create teacher: ' + error.message);
        }
    }

    function validateTeacherForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const formData = new FormData(form);
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Name validation
        if (!formData.get('name').trim()) {
            const nameError = document.getElementById('nameError');
            if (nameError) nameError.textContent = 'Name is required';
            isValid = false;
        }

        // Email validation
        const email = formData.get('email').trim();
        if (!email) {
            const emailError = document.getElementById('emailError');
            if (emailError) emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!isValidEmail(email)) {
            const emailError = document.getElementById('emailError');
            if (emailError) emailError.textContent = 'Invalid email format';
            isValid = false;
        }

        // Password validation
        if (!formData.get('password')) {
            const passwordError = document.getElementById('passwordError');
            if (passwordError) passwordError.textContent = 'Password is required';
            isValid = false;
        }

        return isValid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    window.viewTeacher = function(id) {
        showInfo('View teacher functionality coming soon');
    };

    window.editTeacher = function(id) {
        showInfo('Edit teacher functionality coming soon');
    };

    window.deleteTeacher = async function(id) {
        const confirmed = await showConfirm({
            title: 'Delete Teacher',
            message: 'Are you sure you want to delete this teacher? This action cannot be undone.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });

        if (confirmed) {
            try {
                await api.hod.teachers.delete(id);
                showSuccess('Teacher deleted successfully');
                loadTeachers();
            } catch (error) {
                showError('Failed to delete teacher: ' + error.message);
            }
        }
    };

    // Filter functions
    window.resetFilters = function() {
        const searchInput = document.getElementById('searchInput');
        const classFilter = document.getElementById('classFilter');
        
        if (searchInput) searchInput.value = '';
        if (classFilter) classFilter.value = '';
        
        filteredTeachers = [...allTeachers];
        currentPage = 1;
        renderTable();
    };

})();
