// ===== NOTES PAGE =====

// Global variables
let notesData = [];
let classesData = [];
let divisionsData = [];
let teachersData = [];
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadSidebar();
    loadClasses();
    loadDivisions();
    loadTeachers();
    loadNotes();
    bindEventListeners();
    updateUserInfo(getCurrentUser());
}

function bindEventListeners() {
    // Upload note button
    const uploadBtn = document.getElementById('uploadNoteBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', showUploadModal);
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filter functionality
    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.addEventListener('change', handleFilters);
    }

    const divisionFilter = document.getElementById('divisionFilter');
    if (divisionFilter) {
        divisionFilter.addEventListener('change', handleFilters);
    }

    const teacherFilter = document.getElementById('teacherFilter');
    if (teacherFilter) {
        teacherFilter.addEventListener('change', handleFilters);
    }

    // Modal close handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
        if (e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });
}

async function loadClasses() {
    try {
        const response = await commonAPI.getClasses();
        classesData = response || [];
        populateClassFilters();
    } catch (error) {
        console.error('Load classes error:', error);
        showToast('Failed to load classes', 'error');
    }
}

async function loadDivisions() {
    try {
        const response = await commonAPI.getDivisions();
        divisionsData = response || [];
        populateDivisionFilters();
    } catch (error) {
        console.error('Load divisions error:', error);
        showToast('Failed to load divisions', 'error');
    }
}

async function loadTeachers() {
    try {
        const response = await commonAPI.getTeachers();
        teachersData = response || [];
        populateTeacherFilters();
    } catch (error) {
        console.error('Load teachers error:', error);
        showToast('Failed to load teachers', 'error');
    }
}

async function loadNotes() {
    try {
        showLoading();
        const response = await commonAPI.getNotes();
        notesData = response || [];
        renderNotesGrid();
    } catch (error) {
        console.error('Load notes error:', error);
        showToast('Failed to load notes', 'error');
    } finally {
        hideLoading();
    }
}

function populateClassFilters() {
    const classFilter = document.getElementById('classFilter');
    const classSelect = document.getElementById('classId');
    
    if (classFilter) {
        classFilter.innerHTML = '<option value="">All Classes</option>';
    }
    
    if (classSelect) {
        classSelect.innerHTML = '<option value="">Select Class *</option>';
    }
    
    classesData.forEach(classItem => {
        if (classFilter) {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.className;
            classFilter.appendChild(option);
        }
        
        if (classSelect) {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.className;
            classSelect.appendChild(option);
        }
    });
}

function populateDivisionFilters() {
    const divisionFilter = document.getElementById('divisionFilter');
    const divisionSelect = document.getElementById('divisionId');
    
    if (divisionFilter) {
        divisionFilter.innerHTML = '<option value="">All Divisions</option>';
    }
    
    if (divisionSelect) {
        divisionSelect.innerHTML = '<option value="">Select Division *</option>';
    }
    
    divisionsData.forEach(division => {
        if (divisionFilter) {
            const option = document.createElement('option');
            option.value = division.id;
            option.textContent = division.divisionName;
            divisionFilter.appendChild(option);
        }
        
        if (divisionSelect) {
            const option = document.createElement('option');
            option.value = division.id;
            option.textContent = division.divisionName;
            divisionSelect.appendChild(option);
        }
    });
}

function populateTeacherFilters() {
    const teacherFilter = document.getElementById('teacherFilter');
    const teacherSelect = document.getElementById('teacherId');
    
    if (teacherFilter) {
        teacherFilter.innerHTML = '<option value="">All Teachers</option>';
    }
    
    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">Select Teacher *</option>';
    }
    
    teachersData.forEach(teacher => {
        if (teacherFilter) {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherFilter.appendChild(option);
        }
        
        if (teacherSelect) {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        }
    });
}

function renderNotesGrid() {
    const gridContainer = document.getElementById('notesGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (notesData.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Notes Found</h3>
                <p>No notes have been uploaded yet. Click the "Upload Note" button to add your first note.</p>
            </div>
        `;
        return;
    }

    notesData.forEach(note => {
        const noteCard = createNoteCard(note);
        gridContainer.appendChild(noteCard);
    });
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    
    const fileIcon = getFileIcon(note.fileUrl);
    const fileName = getFileName(note.fileUrl);
    
    card.innerHTML = `
        <div class="note-header">
            <div class="note-icon">
                <i class="fas ${fileIcon}"></i>
            </div>
            <div class="note-actions">
                <button class="btn btn-sm btn-outline" onclick="viewNote(${note.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="downloadNote('${note.fileUrl}')" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editNote(${note.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id}, '${note.title}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-content">
            <h4 class="note-title">${note.title}</h4>
            <p class="note-description">${note.description || 'No description available'}</p>
            <div class="note-meta">
                <span class="note-file">${fileName}</span>
                <span class="note-date">${formatDate(note.createdAt)}</span>
            </div>
            <div class="note-info">
                <span class="note-class">${note.classEntity ? note.classEntity.className : 'N/A'}</span>
                <span class="note-division">${note.division ? note.division.divisionName : 'N/A'}</span>
                <span class="note-teacher">${note.teacher ? note.teacher.name : 'N/A'}</span>
            </div>
        </div>
    `;
    
    return card;
}

function getFileIcon(fileUrl) {
    if (!fileUrl) return 'fa-file';
    
    const extension = fileUrl.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'txt': 'fa-file-alt',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive'
    };
    
    return iconMap[extension] || 'fa-file';
}

function getFileName(fileUrl) {
    if (!fileUrl) return 'No file';
    
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
}

function showUploadModal() {
    populateClassFilters();
    populateDivisionFilters();
    populateTeacherFilters();
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Upload New Note</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="uploadNoteForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="noteTitle">Title *</label>
                            <input type="text" id="noteTitle" name="title" required 
                                   placeholder="Enter note title">
                        </div>
                        <div class="form-group">
                            <label for="noteDescription">Description</label>
                            <textarea id="noteDescription" name="description" rows="3" 
                                      placeholder="Enter note description"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="noteFile">File *</label>
                            <input type="file" id="noteFile" name="file" required 
                                   accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar">
                            <small>Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, ZIP, RAR</small>
                        </div>
                        <div class="form-group">
                            <label for="classId">Class *</label>
                            <select id="classId" name="classId" required>
                                <option value="">Select Class *</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="divisionId">Division *</label>
                            <select id="divisionId" name="divisionId" required>
                                <option value="">Select Division *</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="teacherId">Teacher *</label>
                            <select id="teacherId" name="teacherId" required>
                                <option value="">Select Teacher *</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Upload Note</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
    populateClassFilters();
    populateDivisionFilters();
    populateTeacherFilters();
    document.getElementById('uploadNoteForm').addEventListener('submit', handleUploadNote);
}

function viewNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Note Details</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="note-detail">
                        <div class="detail-header">
                            <div class="detail-icon">
                                <i class="fas ${getFileIcon(note.fileUrl)}"></i>
                            </div>
                            <div class="detail-info">
                                <h4>${note.title}</h4>
                                <p>${note.description || 'No description available'}</p>
                            </div>
                        </div>
                        <div class="detail-meta">
                            <div class="meta-item">
                                <label>File:</label>
                                <span>${getFileName(note.fileUrl)}</span>
                            </div>
                            <div class="meta-item">
                                <label>Class:</label>
                                <span>${note.classEntity ? note.classEntity.className : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Division:</label>
                                <span>${note.division ? note.division.divisionName : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Teacher:</label>
                                <span>${note.teacher ? note.teacher.name : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Uploaded:</label>
                                <span>${formatDateTime(note.createdAt)}</span>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>
                            <button type="button" class="btn btn-primary" onclick="downloadNote('${note.fileUrl}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button type="button" class="btn btn-warning" onclick="editNote(${note.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

function editNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    populateClassFilters();
    populateDivisionFilters();
    populateTeacherFilters();
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Note</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editNoteForm">
                        <div class="form-group">
                            <label for="editNoteTitle">Title *</label>
                            <input type="text" id="editNoteTitle" name="title" required 
                                   value="${note.title}" placeholder="Enter note title">
                        </div>
                        <div class="form-group">
                            <label for="editNoteDescription">Description</label>
                            <textarea id="editNoteDescription" name="description" rows="3" 
                                      placeholder="Enter note description">${note.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editClassId">Class *</label>
                            <select id="editClassId" name="classId" required>
                                <option value="">Select Class *</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editDivisionId">Division *</label>
                            <select id="editDivisionId" name="divisionId" required>
                                <option value="">Select Division *</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editTeacherId">Teacher *</label>
                            <select id="editTeacherId" name="teacherId" required>
                                <option value="">Select Teacher *</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update Note</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
    populateClassFilters();
    populateDivisionFilters();
    populateTeacherFilters();
    
    // Set selected values
    setTimeout(() => {
        const classSelect = document.getElementById('editClassId');
        const divisionSelect = document.getElementById('editDivisionId');
        const teacherSelect = document.getElementById('editTeacherId');
        
        if (classSelect && note.classEntity) {
            classSelect.value = note.classEntity.id;
        }
        
        if (divisionSelect && note.division) {
            divisionSelect.value = note.division.id;
        }
        
        if (teacherSelect && note.teacher) {
            teacherSelect.value = note.teacher.id;
        }
    }, 100);
    
    document.getElementById('editNoteForm').addEventListener('submit', (event) => {
        handleEditNote(event, note.id);
    });
}

async function handleUploadNote(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const fileInput = document.getElementById('noteFile');
    
    if (!fileInput.files[0]) {
        showToast('Please select a file to upload', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await commonAPI.uploadNote(formData);
        
        showToast('Note uploaded successfully', 'success');
        closeModal();
        loadNotes(); // Refresh data
        
    } catch (error) {
        console.error('Upload note error:', error);
        showToast(error.message || 'Failed to upload note', 'error');
    } finally {
        hideLoading();
    }
}

async function handleEditNote(event, noteId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const noteData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        classId: parseInt(formData.get('classId')),
        divisionId: parseInt(formData.get('divisionId')),
        teacherId: parseInt(formData.get('teacherId'))
    };
    
    if (!noteData.title || !noteData.classId || !noteData.divisionId || !noteData.teacherId) {
        showToast('All required fields must be filled', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await commonAPI.updateNote(noteId, noteData);
        
        showToast('Note updated successfully', 'success');
        closeModal();
        loadNotes(); // Refresh data
        
    } catch (error) {
        console.error('Update note error:', error);
        showToast(error.message || 'Failed to update note', 'error');
    } finally {
        hideLoading();
    }
}

function downloadNote(fileUrl) {
    if (!fileUrl) {
        showToast('No file available for download', 'error');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = getFileName(fileUrl);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteNote(noteId, noteTitle) {
    showConfirmModal(
        `Are you sure you want to delete note "${noteTitle}"? This action cannot be undone.`,
        () => {
            performDelete(noteId);
        },
        {
            title: 'Delete Note',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        }
    );
}

async function performDelete(noteId) {
    showLoading();
    
    try {
        await commonAPI.deleteNote(noteId);
        
        showToast('Note deleted successfully', 'success');
        loadNotes(); // Refresh data
        
    } catch (error) {
        console.error('Delete note error:', error);
        showToast(error.message || 'Failed to delete note', 'error');
    } finally {
        hideLoading();
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    const filteredData = notesData.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        (note.description && note.description.toLowerCase().includes(searchTerm)) ||
        getFileName(note.fileUrl).toLowerCase().includes(searchTerm)
    );
    
    renderFilteredNotes(filteredData);
}

function handleFilters() {
    const classFilter = document.getElementById('classFilter')?.value;
    const divisionFilter = document.getElementById('divisionFilter')?.value;
    const teacherFilter = document.getElementById('teacherFilter')?.value;
    
    let filteredData = notesData;
    
    if (classFilter) {
        filteredData = filteredData.filter(note => 
            note.classEntity && note.classEntity.id.toString() === classFilter
        );
    }
    
    if (divisionFilter) {
        filteredData = filteredData.filter(note => 
            note.division && note.division.id.toString() === divisionFilter
        );
    }
    
    if (teacherFilter) {
        filteredData = filteredData.filter(note => 
            note.teacher && note.teacher.id.toString() === teacherFilter
        );
    }
    
    renderFilteredNotes(filteredData);
}

function renderFilteredNotes(filteredData) {
    const gridContainer = document.getElementById('notesGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (filteredData.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Notes Found</h3>
                <p>No notes match your search criteria.</p>
            </div>
        `;
        return;
    }

    filteredData.forEach(note => {
        const noteCard = createNoteCard(note);
        gridContainer.appendChild(noteCard);
    });
}
