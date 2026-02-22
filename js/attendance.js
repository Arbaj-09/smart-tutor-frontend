// ===== ATTENDANCE PAGE =====

// Global variables
let attendanceData = [];
let studentsData = [];
let classesData = [];
let divisionsData = [];
let selectedDate = new Date().toISOString().split('T')[0];
let selectedClass = '';
let selectedDivision = '';
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadSidebar();
    loadClasses();
    loadDivisions();
    bindEventListeners();
    updateUserInfo(getCurrentUser());
    
    // Set today's date as default
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = selectedDate;
    }
}

function bindEventListeners() {
    // Date change
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.addEventListener('change', handleDateChange);
    }

    // Class filter
    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.addEventListener('change', handleClassChange);
    }

    // Division filter
    const divisionFilter = document.getElementById('divisionFilter');
    if (divisionFilter) {
        divisionFilter.addEventListener('change', handleDivisionChange);
    }

    // Load attendance button
    const loadBtn = document.getElementById('loadAttendanceBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadAttendanceData);
    }

    // Save attendance button
    const saveBtn = document.getElementById('saveAttendanceBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAttendance);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAttendance);
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
        populateClassFilter();
    } catch (error) {
        console.error('Load classes error:', error);
        showToast('Failed to load classes', 'error');
    }
}

async function loadDivisions() {
    try {
        const response = await commonAPI.getDivisions();
        divisionsData = response || [];
        populateDivisionFilter();
    } catch (error) {
        console.error('Load divisions error:', error);
        showToast('Failed to load divisions', 'error');
    }
}

function populateClassFilter() {
    const classFilter = document.getElementById('classFilter');
    if (!classFilter) return;

    classFilter.innerHTML = '<option value="">Select Class *</option>';
    
    classesData.forEach(classItem => {
        const option = document.createElement('option');
        option.value = classItem.id;
        option.textContent = classItem.className;
        classFilter.appendChild(option);
    });
}

function populateDivisionFilter() {
    const divisionFilter = document.getElementById('divisionFilter');
    if (!divisionFilter) return;

    divisionFilter.innerHTML = '<option value="">Select Division *</option>';
    
    divisionsData.forEach(division => {
        const option = document.createElement('option');
        option.value = division.id;
        option.textContent = division.divisionName;
        divisionFilter.appendChild(option);
    });
}

function handleDateChange(event) {
    selectedDate = event.target.value;
    if (selectedClass && selectedDivision) {
        loadAttendanceData();
    }
}

function handleClassChange(event) {
    selectedClass = event.target.value;
    selectedDivision = '';
    
    // Reset division filter
    const divisionFilter = document.getElementById('divisionFilter');
    if (divisionFilter) {
        divisionFilter.value = '';
    }
    
    // Clear attendance data
    clearAttendanceData();
    
    if (selectedClass) {
        loadStudents();
    }
}

function handleDivisionChange(event) {
    selectedDivision = event.target.value;
    
    if (selectedClass && selectedDivision) {
        loadAttendanceData();
    }
}

async function loadStudents() {
    if (!selectedClass) return;
    
    try {
        showLoading();
        const response = await commonAPI.getStudentsByClassAndDivision(selectedClass, selectedDivision || 0);
        studentsData = response || [];
        renderAttendanceTable();
    } catch (error) {
        console.error('Load students error:', error);
        showToast('Failed to load students', 'error');
    } finally {
        hideLoading();
    }
}

async function loadAttendanceData() {
    if (!selectedClass || !selectedDivision || !selectedDate) {
        showToast('Please select class, division, and date', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        // Load students first
        await loadStudents();
        
        // Load existing attendance for the date
        const response = await commonAPI.getAttendance({ 
            date: selectedDate,
            classId: selectedClass,
            divisionId: selectedDivision 
        });
        
        attendanceData = response || [];
        updateAttendanceStatus();
        updateAttendanceSummary();
        
    } catch (error) {
        console.error('Load attendance error:', error);
        showToast('Failed to load attendance data', 'error');
    } finally {
        hideLoading();
    }
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (studentsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No students found</td>
            </tr>
        `;
        return;
    }

    studentsData.forEach(student => {
        const row = document.createElement('tr');
        const attendanceRecord = attendanceData.find(a => a.student && a.student.id === student.id);
        const currentStatus = attendanceRecord ? attendanceRecord.status : 'PRESENT';
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.rollNo || 'N/A'}</td>
            <td>
                <select class="attendance-status" data-student-id="${student.id}">
                    <option value="PRESENT" ${currentStatus === 'PRESENT' ? 'selected' : ''}>Present</option>
                    <option value="ABSENT" ${currentStatus === 'ABSENT' ? 'selected' : ''}>Absent</option>
                    <option value="LATE" ${currentStatus === 'LATE' ? 'selected' : ''}>Late</option>
                    <option value="EXCUSED" ${currentStatus === 'EXCUSED' ? 'selected' : ''}>Excused</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewStudentAttendance(${student.id})">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateAttendanceStatus() {
    const statusSelects = document.querySelectorAll('.attendance-status');
    statusSelects.forEach(select => {
        const studentId = parseInt(select.dataset.studentId);
        const attendanceRecord = attendanceData.find(a => a.student && a.student.id === studentId);
        
        if (attendanceRecord) {
            select.value = attendanceRecord.status;
        }
    });
}

function updateAttendanceSummary() {
    const totalStudents = studentsData.length;
    const presentCount = attendanceData.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendanceData.filter(a => a.status === 'ABSENT').length;
    const lateCount = attendanceData.filter(a => a.status === 'LATE').length;
    const excusedCount = attendanceData.filter(a => a.status === 'EXCUSED').length;
    
    // Update summary cards
    updateSummaryCard('totalStudents', totalStudents);
    updateSummaryCard('presentCount', presentCount);
    updateSummaryCard('absentCount', absentCount);
    updateSummaryCard('lateCount', lateCount);
    updateSummaryCard('excusedCount', excusedCount);
    
    // Calculate attendance percentage
    const attendancePercentage = totalStudents > 0 ? 
        ((presentCount + lateCount + excusedCount) / totalStudents * 100).toFixed(1) : 0;
    updateSummaryCard('attendancePercentage', attendancePercentage + '%');
}

function updateSummaryCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function clearAttendanceData() {
    const tbody = document.getElementById('attendanceTableBody');
    if (tbody) {
        tbody.innerHTML = '';
    }
    
    // Reset summary
    ['totalStudents', 'presentCount', 'absentCount', 'lateCount', 'excusedCount', 'attendancePercentage'].forEach(id => {
        updateSummaryCard(id, '0');
    });
}

async function saveAttendance() {
    if (!selectedClass || !selectedDivision || !selectedDate) {
        showToast('Please select class, division, and date', 'warning');
        return;
    }
    
    const statusSelects = document.querySelectorAll('.attendance-status');
    const attendanceUpdates = [];
    
    statusSelects.forEach(select => {
        const studentId = parseInt(select.dataset.studentId);
        const status = select.value;
        
        attendanceUpdates.push({
            student: { id: studentId },
            attendanceDate: selectedDate,
            status: status
        });
    });
    
    if (attendanceUpdates.length === 0) {
        showToast('No students to mark attendance', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        // Save each attendance record
        const promises = attendanceUpdates.map(async (attendance) => {
            return await commonAPI.markAttendance(attendance);
        });
        
        await Promise.all(promises);
        
        showToast('Attendance saved successfully', 'success');
        loadAttendanceData(); // Refresh data
        
    } catch (error) {
        console.error('Save attendance error:', error);
        showToast(error.message || 'Failed to save attendance', 'error');
    } finally {
        hideLoading();
    }
}

async function viewStudentAttendance(studentId) {
    const student = studentsData.find(s => s.id === studentId);
    if (!student) return;
    
    try {
        showLoading();
        const response = await commonAPI.getAttendanceByStudent(studentId);
        const studentAttendance = response || [];
        
        showStudentAttendanceModal(student, studentAttendance);
        
    } catch (error) {
        console.error('Load student attendance error:', error);
        showToast('Failed to load student attendance', 'error');
    } finally {
        hideLoading();
    }
}

function showStudentAttendanceModal(student, attendanceData) {
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Attendance History - ${student.name}</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="attendance-summary">
                        <div class="summary-item">
                            <label>Total Days:</label>
                            <span>${attendanceData.length}</span>
                        </div>
                        <div class="summary-item">
                            <label>Present:</label>
                            <span>${attendanceData.filter(a => a.status === 'PRESENT').length}</span>
                        </div>
                        <div class="summary-item">
                            <label>Absent:</label>
                            <span>${attendanceData.filter(a => a.status === 'ABSENT').length}</span>
                        </div>
                        <div class="summary-item">
                            <label>Late:</label>
                            <span>${attendanceData.filter(a => a.status === 'LATE').length}</span>
                        </div>
                    </div>
                    <div class="attendance-list">
                        <h4>Attendance Records</h4>
                        <div class="attendance-records">
                            ${attendanceData.map(record => `
                                <div class="attendance-record">
                                    <span class="date">${formatDate(record.attendanceDate)}</span>
                                    <span class="status status-${record.status.toLowerCase()}">${record.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

async function exportAttendance() {
    if (!selectedClass || !selectedDivision || !selectedDate) {
        showToast('Please select class, division, and date', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        // Get attendance data for export
        const response = await commonAPI.getAttendance({ 
            date: selectedDate,
            classId: selectedClass,
            divisionId: selectedDivision 
        });
        
        const exportData = response || [];
        
        // Create CSV content
        const csvContent = generateAttendanceCSV(exportData);
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedDate}_class_${selectedClass}_division_${selectedDivision}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Attendance exported successfully', 'success');
        
    } catch (error) {
        console.error('Export attendance error:', error);
        showToast('Failed to export attendance', 'error');
    } finally {
        hideLoading();
    }
}

function generateAttendanceCSV(attendanceData) {
    const headers = ['Student ID', 'Student Name', 'Roll No', 'Date', 'Status'];
    const rows = attendanceData.map(record => [
        record.student?.id || '',
        record.student?.name || '',
        record.student?.rollNo || '',
        record.attendanceDate || '',
        record.status || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}
