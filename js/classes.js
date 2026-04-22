// ===== CLASSES MANAGEMENT =====

(function() {
    console.log('✅ classes.js loaded');
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
        console.log('📡 Calling API: /api/hod/classes');
        try {
            showGlobalLoading();
            const classes = await hodAPI.getAllClasses();
            console.log('📥 API response classes:', classes);
            allClasses = classes || [];
            filteredClasses = [...allClasses];
            console.log('🧠 allClasses:', allClasses);
            console.log('🧠 filteredClasses:', filteredClasses);
            if (classes.length === 0) {
                console.warn('⚠️ API returned empty classes list');
            }
            renderTable();
        } catch (error) {
            console.error('Failed to load classes:', error);
            showError('Failed to load classes');
            renderEmptyState();
        } finally {
            hideGlobalLoading();
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
        console.log('🎨 renderTable called');
        const tbody = document.getElementById('classesTableBody');
        const skeleton = document.getElementById('skeletonLoader');
        const wrapper = document.getElementById('tableWrapper');
        console.log('🔍 classesTableBody:', tbody);
        console.log('🔍 skeletonLoader:', skeleton);
        console.log('🔍 tableWrapper:', wrapper);
        
        if (!tbody) {
            console.error('❌ DOM ID not found: classesTableBody');
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
        
        const total = filteredClasses.length;
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, total);
        const pageData = filteredClasses.slice(start, end);

        console.log('🧩 Rendering rows:', pageData.length);
        console.log('➡ Row data sample:', pageData[0]);

        if (total === 0) {
            renderEmptyState();
            return;
        }

        tbody.innerHTML = pageData.map(cls => `
            <tr>
                <td>${escapeHtml(cls.className)}</td>
                <td>${cls.studentCount || 0}</td>
                <td>${cls.teacherCount || 0}</td>
                <td>${formatDate(cls.createdAt)}</td>
                <td class="actions-cell">
                    <button class="icon-btn" onclick="window.classesApp.viewClass(${cls.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-btn" onclick="window.classesApp.editClass(${cls.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="window.classesApp.deleteClass(${cls.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        console.log('✅ Table rendered, tbody.children.length:', tbody.children.length);
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
                        <button class="btn btn-primary" onclick="window.classesApp.showCreateModal()">
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
        const infoEl = document.getElementById('paginationInfo');
        const pageInfoEl = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (infoEl) {
            infoEl.textContent = total === 0 ? 'Showing 0 of 0 classes' : `Showing ${start + 1}-${end} of ${total} classes`;
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

    window.goToPage = function(page) {
        const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTable();
    };

    // Modal functions
    function showCreateModal() {
        const content = `
            <form id="classForm" class="form-section">
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
            size: 'medium',
            customActions: `
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="window.classesApp.submitClass()">Create Class</button>
            `
        });
    }

    async function submitClass() {
        const form = document.getElementById('classForm');
        if (!form) return;
        
        if (!validateClassForm('classForm')) {
            return;
        }

        const formData = new FormData(form);
        const classData = {
            className: formData.get('className').trim(),
            description: formData.get('description').trim(),
            active: formData.get('active') === 'true'
        };

        try {
            showGlobalLoading();
            await hodAPI.createClass(classData);
            closeModal();
            showSuccess('Class created successfully');
            loadClasses();
        } catch (error) {
            showError('Failed to create class: ' + error.message);
        } finally {
            hideGlobalLoading();
        }
    }

    function validateClassForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const formData = new FormData(form);
        let isValid = true;

        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        if (!formData.get('className').trim()) {
            const classNameError = document.getElementById('classNameError');
            if (classNameError) classNameError.textContent = 'Class name is required';
            isValid = false;
        }

        return isValid;
    }

    // CRUD operations
    function viewClass(id) {
        console.log('🖱️ View clicked for ID:', id);
        const cls = allClasses.find(c => c.id === id);
        if (!cls) {
            showError('Class not found');
            return;
        }
        const content = `
            <p><strong>Class Name:</strong> ${escapeHtml(cls.className)}</p>
            <p><strong>Description:</strong> ${escapeHtml(cls.description || 'N/A')}</p>
            <p><strong>Student Count:</strong> ${cls.studentCount || 0}</p>
            <p><strong>Teacher Count:</strong> ${cls.teacherCount || 0}</p>
            <p><strong>Created Date:</strong> ${formatDate(cls.createdAt)}</p>
        `;
        console.log('🪟 Opening modal with data:', cls);
        showModal({
            title: 'Class Details',
            content,
            size: 'medium',
            customActions: `<button class="btn btn-primary" onclick="closeModal()">Close</button>`
        });
        console.log('✅ Modal opened');
    }

    function editClass(id) {
        console.log('🖱️ Edit clicked for ID:', id);
        const cls = allClasses.find(c => c.id === id);
        if (!cls) {
            showError('Class not found');
            return;
        }
        console.log('🪟 Opening modal with data:', cls);
        const content = `
            <form id="classForm" class="form-section">
                <div class="form-group">
                    <label for="className">Class Name *</label>
                    <input type="text" id="className" name="className" value="${escapeHtml(cls.className)}" required>
                    <span class="error-message" id="classNameError"></span>
                </div>
                <div class="form-group">
                    <label for="classDescription">Description</label>
                    <textarea id="classDescription" name="description" rows="3">${escapeHtml(cls.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="classActive">Status</label>
                    <select id="classActive" name="active">
                        <option value="true" ${cls.active ? 'selected' : ''}>Active</option>
                        <option value="false" ${!cls.active ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </form>
        `;
        showModal({
            title: 'Edit Class',
            content,
            size: 'medium',
            customActions: `
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="window.classesApp.updateClass(${id})">Update Class</button>
            `
        });
        console.log('✅ Modal opened');
    }

    async function updateClass(id) {
        const form = document.getElementById('classForm');
        if (!form || !validateClassForm('classForm')) return;
        const formData = new FormData(form);
        const classData = {
            className: formData.get('className').trim(),
            description: formData.get('description').trim(),
            active: formData.get('active') === 'true'
        };
        try {
            showGlobalLoading();
            await hodAPI.updateClass(id, classData);
            closeModal();
            showSuccess('Class updated successfully');
            loadClasses();
        } catch (error) {
            showError('Failed to update class: ' + error.message);
        } finally {
            hideGlobalLoading();
        }
    }

    async function deleteClass(id) {
        console.log('🖱️ Delete clicked for ID:', id);
        console.log('⚠️ Delete confirmation triggered');
        const confirmed = await showConfirm('Are you sure you want to delete this class? This action cannot be undone.');

        console.log('🧨 Delete confirmed:', confirmed);
        if (confirmed) {
            try {
                showGlobalLoading();
                await hodAPI.deleteClass(id);
                showSuccess('Class deleted successfully');
                loadClasses();
            } catch (error) {
                showError('Failed to delete class: ' + error.message);
            } finally {
                hideGlobalLoading();
            }
        }
    }

    function applyFilters() {
        handleSearch();
    }
    
    function refreshData() {
        loadClasses();
    }
    
    function resetFilters() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        filteredClasses = [...allClasses];
        currentPage = 1;
        renderTable();
    }

    function goToPage(page) {
        const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTable();
    }

    // Expose public API BEFORE init
    window.classesApp = {
        showCreateModal,
        viewClass,
        editClass,
        updateClass,
        deleteClass,
        submitClass,
        applyFilters,
        refreshData,
        resetFilters,
        goToPage,
        prevPage: () => goToPage(currentPage - 1),
        nextPage: () => goToPage(currentPage + 1)
    };
    console.log('✅ window.classesApp exposed:', Object.keys(window.classesApp));

})();
