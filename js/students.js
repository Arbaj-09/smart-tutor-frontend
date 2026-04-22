(function () {
    console.log('✅ students.js loaded');
    const PAGE_SIZE = 10;

    let allStudents = [];
    let allClasses = [];
    let allDivisions = [];
    let allTeachers = [];
    let filteredStudents = [];
    let currentPage = 1;
    let editingStudentId = null;

    function requireTeacher() {
        // Manual user check (same as other pages)
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.warn("Redirect prevented for demo - students.js");
            return null;
        }
        
        let user;
        try {
            user = JSON.parse(userStr);
        } catch (error) {
            console.warn("Redirect prevented for demo - students.js parse error");
            return null;
        }
        
        if (!user?.name || !user?.role) {
            console.warn("Redirect prevented for demo - students.js");
            return null;
        }
        const role = String(user.role).toUpperCase();
        // Allow both TEACHER and HOD to access this page
        if (role !== 'TEACHER' && role !== 'HOD') {
            console.warn("Redirect prevented for demo - students.js role check");
            return null;
        }
        return { name: user.name, role };
    }

    // Simple confirm function if showConfirm is not available
    function showConfirm(options) {
        return new Promise((resolve) => {
            const confirmed = window.confirm(options.message || options.title || 'Are you sure?');
            resolve(confirmed);
        });
    }

    // Simple toast functions if not available
    function showSuccess(message) {
        console.log('SUCCESS:', message);
        if (window.showSuccessToast) {
            window.showSuccessToast(message);
        } else {
            alert('✅ ' + message);
        }
    }

    function showError(message) {
        console.log('ERROR:', message);
        if (window.showErrorToast) {
            window.showErrorToast(message);
        } else {
            alert('❌ ' + message);
        }
    }

    function $(id) {
        return document.getElementById(id);
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
        const divisionId = $('divisionFilter')?.value || '';

        filteredStudents = allStudents.filter(s => {
            const matchSearch = !search || (
                s.name.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search) ||
                ((s.rollNumber || s.rollNo) && (s.rollNumber || s.rollNo).toLowerCase().includes(search))
            );
            // Filter by class name and division name from API response
            const classObj = !classId || allClasses.find(c => c.id == classId);
            const divisionObj = !divisionId || allDivisions.find(d => d.id == divisionId);
            
            const matchClass = !classId || (classObj && s.className === classObj.className);
            const matchDivision = !divisionId || (divisionObj && s.divisionName === divisionObj.divisionName);
            
            return matchSearch && matchClass && matchDivision;
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
            rows: filteredStudents.slice(start, end),
            total: filteredStudents.length,
        };
    }

    function renderTable() {
        console.log('🎨 renderTable called');
        const tbody = $('studentsTableBody');
        const skeleton = $('skeletonLoader');
        const wrapper = $('tableWrapper');
        const empty = $('emptyState');
        console.log('🔍 studentsTableBody:', tbody);
        console.log('🔍 skeletonLoader:', skeleton);
        console.log('🔍 tableWrapper:', wrapper);
        
        if (!tbody) {
            console.error('❌ DOM ID not found: studentsTableBody');
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

        const page = getPageSlice();
        console.log('🧩 Rendering rows:', page.rows.length);
        console.log('➡ Row data sample:', page.rows[0]);

        if (page.total === 0) {
            tbody.innerHTML = '';
            if (wrapper) wrapper.style.display = 'none';
            if (empty) empty.style.display = 'block';
            updatePaginationInfo(0, 0, 0);
            return;
        }

        if (empty) empty.style.display = 'none';

        tbody.innerHTML = page.rows.map(student => {
            // Use className and divisionName from API response
            const className = student.className || 'N/A';
            const divisionName = student.divisionName || 'N/A';
            
            console.log('📋 Student data:', { id: student.id, name: student.name, className, divisionName });
            
            return `
                <tr>
                    <td>${safeText(student.name)}</td>
                    <td><a href="mailto:${safeText(student.email)}" class="email-link">${safeText(student.email)}</a></td>
                    <td><span class="badge badge-primary">${safeText(className)}</span></td>
                    <td><span class="badge badge-secondary">${safeText(divisionName)}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn" onclick="window.studentsApp.viewStudent(${student.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="icon-btn" onclick="window.studentsApp.editStudent(${student.id})" title="Edit Student">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn danger" onclick="window.studentsApp.deleteStudent(${student.id})" title="Delete Student">
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
            info.textContent = total === 0 ? 'No students' : `Showing ${from}-${to} of ${total}`;
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
                <span id="paginationInfo">${total === 0 ? 'No students' : `Showing ${from}-${to} of ${total}`}</span>
            </div>
            <div class="pagination-right">
                <button class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.studentsApp.prevPage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info" id="pageInfo">Page ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.studentsApp.nextPage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    function populateFilters() {
        const classFilter = $('classFilter');
        if (classFilter && allClasses) {
            classFilter.innerHTML = '<option value="">All Classes</option>' + 
                allClasses.map(c => `<option value="${c.id}">${safeText(c.className)}</option>`).join('');
        }

        const divisionFilter = $('divisionFilter');
        if (divisionFilter && allDivisions) {
            divisionFilter.innerHTML = '<option value="">All Divisions</option>' + 
                allDivisions.map(d => `<option value="${d.id}">${safeText(d.divisionName)}</option>`).join('');
        }
    }

    async function loadInitialData() {
        console.log('📡 Calling API: students, classes, divisions');
        try {
            showLoading();
            
            // Manual user check (same as other pages)
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                throw new Error('User not found in localStorage');
            }
            
            let user;
            try {
                user = JSON.parse(userStr);
            } catch (error) {
                throw new Error('Failed to parse user data');
            }
            
            if (!user || (!user.userId && !user.id)) {
                throw new Error('User not found or invalid user data');
            }
            
            console.log('🔍 STUDENTS: Using user for API calls:', user);

            let studentsResponse;
            const role = String(user.role).toUpperCase();
            const userId = user.userId || user.id;
            
            if (role === 'HOD') {
                studentsResponse = await api.get(`${API_PREFIX}/hod/students`);
            } else {
                studentsResponse = await api.get(`${API_PREFIX}/teachers/${userId}/students`);
            }

            const [classesResponse, divisionsResponse] = await Promise.all([
                hodAPI.getAllClasses(),
                hodAPI.getAllDivisions()
            ]);

            console.log('📥 API response students:', studentsResponse);
            console.log('📥 API response classes:', classesResponse);
            console.log('📥 API response divisions:', divisionsResponse);

            if (studentsResponse) {
                console.log('🔍 Students data structure:', studentsResponse);
                if (Array.isArray(studentsResponse)) {
                    console.log('📊 Students count:', studentsResponse.length);
                    if (studentsResponse.length > 0) {
                        console.log('👤 First student sample:', studentsResponse[0]);
                    }
                }
                allStudents = studentsResponse;
                filteredStudents = studentsResponse;
                if (studentsResponse.length === 0) {
                    console.log('📭 No students found in database');
                }
            } else {
                console.log('⚠️ No students response received');
            }

            if (classesResponse) {
                allClasses = classesResponse;
            }

            if (divisionsResponse) {
                allDivisions = divisionsResponse;
            }

            populateFilters();
            applyFilters();
        } catch (error) {
            console.error('Load initial data error:', error);
            showError('Failed to load data');
        } finally {
            hideLoading();
        }
    }

    function openStudentModal({ mode = 'create', student = null }) {
        console.log('🪟 Opening student modal, mode:', mode);
        console.log('📚 Available classes:', allClasses);
        console.log('📋 Available divisions:', allDivisions);
        
        editingStudentId = mode === 'edit' ? student?.id : null;
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Student' : 'Add Student';

        const name = student?.name || '';
        const rollNumber = student?.rollNo || '';
        const email = student?.email || '';
        
        // For edit mode, find class and division IDs by matching names
        let classId = '';
        let divisionId = '';
        
        if (isEdit) {
            const classObj = allClasses.find(c => c.className === student?.className);
            const divisionObj = allDivisions.find(d => d.divisionName === student?.divisionName);
            classId = classObj?.id || '';
            divisionId = divisionObj?.id || '';
        }

        const content = `
            <form id="studentForm" class="form-section">
                <div class="form-group">
                    <label for="studentName">Full Name</label>
                    <input type="text" id="studentName" name="name" class="form-control" value="${safeText(name)}" required placeholder="Enter full name" maxlength="100" />
                </div>
                <div class="form-group">
                    <label for="rollNumber">Roll Number</label>
                    <input type="text" id="rollNumber" name="rollNumber" class="form-control" value="${safeText(rollNumber)}" required placeholder="Enter roll number" maxlength="20" />
                </div>
                <div class="form-group">
                    <label for="studentEmail">Email Address</label>
                    <input type="email" id="studentEmail" name="email" class="form-control" value="${safeText(email)}" required placeholder="Enter email address" maxlength="100" />
                </div>
                <div class="form-group">
                    <label for="studentPhone">Phone Number</label>
                    <input type="tel" id="studentPhone" name="phone" class="form-control" value="${safeText(student?.phone || '')}" placeholder="Enter phone number" maxlength="20" />
                </div>
                <div class="form-group">
                    <label for="classId">Class</label>
                    <select id="classId" name="classId" class="form-control form-select" required>
                        <option value="">Select Class</option>
                        ${allClasses.map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${safeText(c.className)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="divisionId">Division</label>
                    <select id="divisionId" name="divisionId" class="form-control form-select" required>
                        <option value="">Select Division</option>
                        ${allDivisions.map(d => `<option value="${d.id}" ${d.id == divisionId ? 'selected' : ''}>${safeText(d.divisionName)}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        console.log('🎨 Showing modal with title:', title);
        console.log('📝 Modal content length:', content.length);
        console.log('🔍 showModal function available:', typeof showModal);
        
        if (typeof showModal !== 'function') {
            console.error('❌ showModal function not available!');
            alert('Modal system not loaded. Please refresh the page.');
            return;
        }
        
        // Add a test to verify window.studentsApp.submitStudent exists
        console.log('🔍 window.studentsApp.submitStudent available:', typeof window.studentsApp?.submitStudent);
        
        showModal({
            title,
            content,
            type: 'custom',
            size: 'medium',
            buttons: [
                {
                    text: 'Cancel',
                    class: 'btn-outline',
                    action: 'close'
                },
                {
                    text: isEdit ? 'Update' : 'Create',
                    class: 'btn-primary',
                    action: 'submit'
                }
            ],
            onSubmit: function() {
                console.log('🔘 Create button clicked via action!');
                window.studentsApp.submitStudent();
            }
        });
        
        console.log('✅ Modal should be displayed now with proper action buttons');
    }

    async function submitStudent() {
        console.log('🚀 submitStudent called');
        const form = document.getElementById('studentForm');
        if (!form) {
            console.log('❌ Form not found');
            return;
        }
        console.log('✅ Form found:', form);

        const fd = new FormData(form);
        const payload = {
            name: fd.get('name')?.trim(),
            rollNumber: fd.get('rollNumber')?.trim(),
            email: fd.get('email')?.trim(),
            phone: fd.get('phone')?.trim() || '1234567890', // Default phone if not provided
            classId: Number(fd.get('classId')),
            divisionId: Number(fd.get('divisionId'))
        };
        
        console.log('📋 Form data extracted:', payload);

        if (!payload.name || !payload.rollNumber || !payload.email || !payload.classId || !payload.divisionId) {
            console.log('❌ Validation failed:', {
                name: !!payload.name,
                rollNumber: !!payload.rollNumber,
                email: !!payload.email,
                classId: !!payload.classId,
                divisionId: !!payload.divisionId
            });
            showError('Please fill all required fields');
            return;
        }
        
        console.log('✅ Validation passed');

        try {
            showLoading();
            const user = getCurrentUser();
            if (!user || (!user.userId && !user.id)) {
                throw new Error('User not found');
            }
            const userId = user.userId || user.id;
            const role = String(user.role).toUpperCase();
            
            if (editingStudentId) {
                if (role === 'HOD') {
                    await api.put(`${API_PREFIX}/hod/students/${editingStudentId}`, payload);
                } else {
                    await api.put(`${API_PREFIX}/teachers/${userId}/students/${editingStudentId}`, payload);
                }
                showSuccess('Student updated successfully');
            } else {
                if (role === 'HOD') {
                    await api.post(`${API_PREFIX}/hod/student`, payload);
                } else {
                    await api.post(`${API_PREFIX}/teachers/${userId}/students`, payload);
                }
                showSuccess('Student created successfully');
            }
            closeModal();
            await loadInitialData();
        } catch (err) {
            console.error('Save student error:', err);
            showError(err.message || 'Failed to save student');
        } finally {
            hideLoading();
        }
    }

    function viewStudent(id) {
        console.log('🖱️ View clicked for ID:', id);
        hideLoading(); // CRITICAL: Clear any active overlay
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showError('Student not found');
            return;
        }

        const className = student.className || 'N/A';
        const divisionName = student.divisionName || 'N/A';
        const teacherName = student.teacherName || 'N/A';

        const content = `
            <p><strong>Full Name:</strong> ${safeText(student.name)}</p>
            <p><strong>Roll Number:</strong> ${safeText(student.rollNo)}</p>
            <p><strong>Email:</strong> ${safeText(student.email)}</p>
            <p><strong>Class:</strong> ${safeText(className)}</p>
            <p><strong>Division:</strong> ${safeText(divisionName)}</p>
            <p><strong>Teacher:</strong> ${safeText(teacherName)}</p>
            <p><strong>Created Date:</strong> ${safeText(formatDate(student.createdAt))}</p>
        `;

        showModal({
            title: 'Student Details',
            content,
            size: 'medium',
            customActions: `
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            `
        });
    }

    function editStudent(id) {
        console.log('🖱️ Edit clicked for ID:', id);
        hideLoading(); // CRITICAL: Clear any active overlay
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showError('Student not found');
            return;
        }
        console.log('🪟 Opening modal with data:', student);
        openStudentModal({ mode: 'edit', student });
    }

    async function deleteStudent(id) {
        console.log('🖱️ Delete clicked for ID:', id);
        hideLoading(); // CRITICAL: Clear any active overlay
        const student = allStudents.find(s => s.id === id);
        if (!student) {
            showError('Student not found');
            return;
        }

        console.log('⚠️ Delete confirmation triggered');
        const confirmed = await showConfirm({
            title: 'Delete Student',
            message: `Are you sure you want to delete <strong>${safeText(student.name)}</strong>? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });

        console.log('🧨 Delete confirmed:', confirmed);

        if (confirmed) {
            try {
                showLoading();
                const user = getCurrentUser();
                if (!user || !user.userId) {
                    throw new Error('User not found');
                }
                
                const userId = user.userId || user.id;
                const role = String(user.role).toUpperCase();
                
                if (role === 'HOD') {
                    await api.delete(`${API_PREFIX}/hod/students/${id}`);
                } else {
                    await api.delete(`${API_PREFIX}/teachers/${userId}/students/${id}`);
                }
                
                showSuccess('Student deleted successfully');
                await loadInitialData();
            } catch (err) {
                console.error('Delete student error:', err);
                showError(err.message || 'Failed to delete student');
            } finally {
                hideLoading();
            }
        }
    }

    function showCreateModal() {
        console.log('🎯 showCreateModal called');
        hideLoading(); // CRITICAL: Clear any active overlay
        openStudentModal({ mode: 'create' });
    }

    function refreshData() {
        loadInitialData();
    }

    // Expose public API BEFORE init
    window.studentsApp = {
        applyFilters,
        resetFilters,
        showCreateModal,
        refreshData,
        submitStudent,
        prevPage: () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPagination();
            }
        },
        nextPage: () => {
            const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        },
        viewStudent,
        editStudent,
        deleteStudent
    };
    console.log('✅ window.studentsApp exposed:', Object.keys(window.studentsApp));

    // Initialize
    function init() {
        console.log('🔍 STUDENTS: students.js init() called');
        const user = requireTeacher();
        console.log('🔍 STUDENTS: requireTeacher() returned:', user);
        if (!user) {
            console.log('🔍 STUDENTS: No user returned from requireTeacher(), exiting init');
            return;
        }

        console.log('🔍 STUDENTS: User validated, calling loadInitialData()');
        loadInitialData();
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
