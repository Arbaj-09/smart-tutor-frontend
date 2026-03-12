// ===== TEACHERS MANAGEMENT =====

(function() {
    console.log('✅ teachers.js loaded');
    const PAGE_SIZE = 10;
    
    let allTeachers = [];
    let filteredTeachers = [];
    let classesData = [];
    let allDivisions = [];
    let currentPage = 1;
    let editingTeacherId = null;

    // Initialize
    document.addEventListener('DOMContentLoaded', async function() {
        await loadClasses();
        await loadDivisions();
        loadTeachers();
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
        console.log('📡 Calling API: /api/hod/teachers');
        try {
            showGlobalLoading();
            const teachers = await hodAPI.getAllTeachers();
            console.log('📥 API response teachers:', teachers);
            allTeachers = teachers || [];
            filteredTeachers = [...allTeachers];
            console.log('🧠 allTeachers:', allTeachers);
            console.log('🧠 filteredTeachers:', filteredTeachers);
            if (teachers.length === 0) {
                console.warn('⚠️ API returned empty teachers list');
            }
            renderTable();
        } catch (error) {
            console.error('Failed to load teachers:', error);
            showError('Failed to load teachers');
            renderEmptyState();
        } finally {
            hideGlobalLoading();
        }
    }

    async function loadClasses() {
        try {
            const classes = await hodAPI.getAllClasses();
            classesData = classes || [];
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
            showError('Failed to load classes');
        }
    }

    async function loadDivisions() {
        try {
            const divisions = await hodAPI.getAllDivisions();
            allDivisions = divisions || [];
        } catch (error) {
            console.error('Failed to load divisions:', error);
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
        console.log('🎨 renderTable called');
        const tbody = document.getElementById('teachersTableBody');
        const skeleton = document.getElementById('skeletonLoader');
        const wrapper = document.getElementById('tableWrapper');
        console.log('🔍 teachersTableBody:', tbody);
        console.log('🔍 skeletonLoader:', skeleton);
        console.log('🔍 tableWrapper:', wrapper);
        
        if (!tbody) {
            console.error('❌ DOM ID not found: teachersTableBody');
            return;
        }
        
        // CRITICAL: Hide skeleton, show table
        if (skeleton) {
            skeleton.style.display = 'none';
            skeleton.style.pointerEvents = 'none';
        }
        if (wrapper) {
            wrapper.style.display = 'block';
            wrapper.style.pointerEvents = 'auto';
        }
        
        const total = filteredTeachers.length;
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, total);
        const pageData = filteredTeachers.slice(start, end);

        console.log('🧩 Rendering rows:', pageData.length);
        console.log('➡ Row data sample:', pageData[0]);

        if (total === 0) {
            renderEmptyState();
            return;
        }

        tbody.innerHTML = pageData.map(teacher => `
            <tr>
                <td>${escapeHtml(teacher.name)}</td>
                <td>${escapeHtml(teacher.email)}</td>
                <td>${escapeHtml(teacher.subject || 'N/A')}</td>
                <td>${escapeHtml(teacher.className || 'N/A')}</td>
                <td>${escapeHtml(teacher.divisionName || 'N/A')}</td>
                <td class="actions-cell">
                    <button class="icon-btn" onclick="window.teachersApp.emailTeacher(${teacher.id})" title="Send Login Details">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button class="icon-btn" onclick="window.teachersApp.editTeacher(${teacher.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="window.teachersApp.deleteTeacher(${teacher.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        console.log('✅ Table rendered, tbody.children.length:', tbody.children.length);
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
                        <button class="btn btn-primary" onclick="window.teachersApp.showCreateModal()">
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
        const infoEl = document.getElementById('paginationInfo');
        const pageInfoEl = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (infoEl) {
            infoEl.textContent = total === 0 ? 'Showing 0 of 0 teachers' : `Showing ${start + 1}-${end} of ${total} teachers`;
        }

        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        
        if (pageInfoEl) {
            pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }

    function goToPage(page) {
        const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTable();
    }

    // Modal functions
    function showCreateModal() {
        editingTeacherId = null;
        const content = `
            <form id="teacherForm" class="form-section">
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
                        <label for="teacherPhone">Phone *</label>
                        <input type="tel" id="teacherPhone" name="phone" required placeholder="Will be used as initial password">
                        <span class="error-message" id="phoneError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherSubject">Subject</label>
                        <input type="text" id="teacherSubject" name="subject">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherClassId">Class</label>
                        <select id="teacherClassId" name="classId" class="form-control form-select">
                            <option value="">Select Class</option>
                            ${classesData.map(c => `<option value="${c.id}">${escapeHtml(c.className)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="teacherDivisionId">Division</label>
                        <select id="teacherDivisionId" name="divisionId" class="form-control form-select">
                            <option value="">Select Division</option>
                            ${allDivisions.map(d => `<option value="${d.id}">${escapeHtml(d.divisionName)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="teacherActive">Status</label>
                    <select id="teacherActive" name="active" class="form-control form-select">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </form>
        `;

        showModal({
            title: 'Add New Teacher',
            content,
            size: 'medium',
            customActions: `
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="window.teachersApp.submitTeacher()">Create Teacher</button>
            `
        });
    }

    async function submitTeacher() {
        const form = document.getElementById('teacherForm');
        if (!form) return;
        
        if (!validateTeacherForm('teacherForm')) {
            return;
        }

        const formData = new FormData(form);
        const teacherData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            subject: formData.get('subject').trim(),
            active: formData.get('active') === 'true'
        };

        // Add class and division if selected
        const classId = formData.get('classId');
        const divisionId = formData.get('divisionId');
        if (classId) teacherData.classId = Number(classId);
        if (divisionId) teacherData.divisionId = Number(divisionId);

        // Auto-set password to phone number for new teachers
        if (!editingTeacherId) {
            teacherData.password = formData.get('phone').trim();
        }

        try {
            showGlobalLoading();
            if (editingTeacherId) {
                await api.hod.teachers.update(editingTeacherId, teacherData);
                showSuccess('Teacher updated successfully');
            } else {
                await api.hod.teachers.create(teacherData);
                showSuccess('Teacher created successfully');
            }
            closeModal();
            loadTeachers();
        } catch (error) {
            showError(error.message);
        } finally {
            hideGlobalLoading();
        }
    }

    function validateTeacherForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const formData = new FormData(form);
        let isValid = true;

        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        if (!formData.get('name').trim()) {
            const nameError = document.getElementById('nameError');
            if (nameError) nameError.textContent = 'Name is required';
            isValid = false;
        }

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

        if (!editingTeacherId && !formData.get('phone').trim()) {
            const phoneError = document.getElementById('phoneError');
            if (phoneError) phoneError.textContent = 'Phone is required (used as password)';
            isValid = false;
        }

        return isValid;
    }

    // CRUD operations
    function editTeacher(id) {
        console.log('🖱️ Edit clicked for ID:', id);
        const teacher = allTeachers.find(t => t.id === id);
        if (!teacher) {
            showError('Teacher not found');
            return;
        }

        console.log('🪟 Opening modal with data:', teacher);
        editingTeacherId = id;
        const content = `
            <form id="teacherForm" class="form-section">
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherName">Name *</label>
                        <input type="text" id="teacherName" name="name" value="${escapeHtml(teacher.name)}" required>
                        <span class="error-message" id="nameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherEmail">Email *</label>
                        <input type="email" id="teacherEmail" name="email" value="${escapeHtml(teacher.email)}" required>
                        <span class="error-message" id="emailError"></span>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherPhone">Phone</label>
                        <input type="tel" id="teacherPhone" name="phone" value="${escapeHtml(teacher.phone || '')}">
                    </div>
                    <div class="form-group">
                        <label for="teacherSubject">Subject</label>
                        <input type="text" id="teacherSubject" name="subject" value="${escapeHtml(teacher.subject || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherClassId">Class</label>
                        <select id="teacherClassId" name="classId" class="form-control form-select">
                            <option value="">Select Class</option>
                            ${classesData.map(c => `<option value="${c.id}" ${c.id == teacher.classId ? 'selected' : ''}>${escapeHtml(c.className)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="teacherDivisionId">Division</label>
                        <select id="teacherDivisionId" name="divisionId" class="form-control form-select">
                            <option value="">Select Division</option>
                            ${allDivisions.map(d => `<option value="${d.id}" ${d.id == teacher.divisionId ? 'selected' : ''}>${escapeHtml(d.divisionName)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="teacherActive">Status</label>
                    <select id="teacherActive" name="active" class="form-control form-select">
                        <option value="true" ${teacher.active ? 'selected' : ''}>Active</option>
                        <option value="false" ${!teacher.active ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </form>
        `;

        showModal({
            title: 'Edit Teacher',
            content,
            size: 'medium',
            customActions: `
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="window.teachersApp.submitTeacher()">Update Teacher</button>
            `
        });
        console.log('✅ Modal opened');
    }

    async function emailTeacher(id) {
        const teacher = allTeachers.find(t => t.id === id);
        if (!teacher) {
            showError('Teacher not found');
            return;
        }

        const content = `
            <div class="teacher-details">
                <div class="detail-row">
                    <strong>Name:</strong> ${escapeHtml(teacher.name)}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${escapeHtml(teacher.email)}
                </div>
                <div class="detail-row">
                    <strong>Phone:</strong> ${escapeHtml(teacher.phone || 'N/A')}
                </div>
                <div class="detail-row">
                    <strong>Subject:</strong> ${escapeHtml(teacher.subject || 'N/A')}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> 
                    <span class="status-badge ${teacher.active ? 'status-active' : 'status-inactive'}">
                        ${teacher.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        `;

        showModal({
            title: 'Send Login Details',
            content,
            size: 'medium',
            customActions: `
                <button class="btn btn-primary" id="sendEmailBtn" onclick="window.teachersApp.sendLoginDetails(${teacher.id})">
                    <i class="fas fa-envelope"></i>
                    Send Login Details
                </button>
            `
        });
    };

    async function sendLoginDetails(teacherId) {
        const sendBtn = document.getElementById('sendEmailBtn');
        if (!sendBtn) return;

        const originalContent = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending email, please wait...';

        try {
            const response = await api.hod.teachers.sendLoginEmail(teacherId);
            closeModal();
            showSuccess('Email sent successfully to ' + response.teacherEmail);
        } catch (error) {
            showError('Failed to send email: ' + error.message);
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalContent;
        }
    };

    async function deleteTeacher(id) {
        console.log('🖱️ Delete clicked for ID:', id);
        console.log('⚠️ Delete confirmation triggered');
        const confirmed = await showConfirm({
            title: 'Delete Teacher',
            message: 'Are you sure you want to delete this teacher? This action cannot be undone.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });

        console.log('🧨 Delete confirmed:', confirmed);
        if (confirmed) {
            try {
                showGlobalLoading();
                await api.hod.teachers.delete(id);
                showSuccess('Teacher deleted successfully');
                loadTeachers();
            } catch (error) {
                showError('Failed to delete teacher: ' + error.message);
            } finally {
                hideGlobalLoading();
            }
        }
    };

    function applyFilters() {
        handleFilter();
    }
    
    function refreshData() {
        loadTeachers();
    }
    
    function resetFilters() {
        const searchInput = document.getElementById('searchInput');
        const classFilter = document.getElementById('classFilter');
        
        if (searchInput) searchInput.value = '';
        if (classFilter) classFilter.value = '';
        
        filteredTeachers = [...allTeachers];
        currentPage = 1;
        renderTable();
    }

    // Expose public API BEFORE init
    window.teachersApp = {
        showCreateModal,
        editTeacher,
        deleteTeacher,
        emailTeacher,
        sendLoginDetails,
        submitTeacher,
        applyFilters,
        refreshData,
        resetFilters,
        goToPage,
        prevPage: () => goToPage(currentPage - 1),
        nextPage: () => goToPage(currentPage + 1),
        currentPage: () => currentPage
    };
    console.log('✅ window.teachersApp exposed:', Object.keys(window.teachersApp));

})();
