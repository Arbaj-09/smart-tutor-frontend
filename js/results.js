// ===== RESULTS PAGE =====

// Global variables
let resultsData = [];
let quizzesData = [];
let studentsData = [];
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadSidebar();
    loadQuizzes();
    loadStudents();
    loadResults();
    bindEventListeners();
    updateUserInfo(getCurrentUser());
}

function bindEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filter functionality
    const quizFilter = document.getElementById('quizFilter');
    if (quizFilter) {
        quizFilter.addEventListener('change', handleFilters);
    }

    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', handleFilters);
    }

    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleFilters);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportResults);
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

async function loadQuizzes() {
    try {
        const response = await commonAPI.getQuizzes();
        quizzesData = response || [];
        populateQuizFilter();
    } catch (error) {
        console.error('Load quizzes error:', error);
        showToast('Failed to load quizzes', 'error');
    }
}

async function loadStudents() {
    try {
        const response = await commonAPI.getStudents();
        studentsData = response || [];
        populateStudentFilter();
    } catch (error) {
        console.error('Load students error:', error);
        showToast('Failed to load students', 'error');
    }
}

async function loadResults() {
    try {
        showLoading();
        const user = getCurrentUser();
        
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        let response;
        if (user.role === 'STUDENT') {
            // Load student's own results
            response = await commonAPI.getStudentQuizAttempts(user.id);
        } else {
            // Load all results for teachers/HOD
            response = await commonAPI.getQuizAttempts();
        }
        
        resultsData = response || [];
        renderResultsTable();
        updateResultsSummary();
        
    } catch (error) {
        console.error('Load results error:', error);
        showToast('Failed to load results', 'error');
    } finally {
        hideLoading();
    }
}

function populateQuizFilter() {
    const quizFilter = document.getElementById('quizFilter');
    if (!quizFilter) return;

    quizFilter.innerHTML = '<option value="">All Quizzes</option>';
    
    quizzesData.forEach(quiz => {
        const option = document.createElement('option');
        option.value = quiz.id;
        option.textContent = quiz.title;
        quizFilter.appendChild(option);
    });
}

function populateStudentFilter() {
    const studentFilter = document.getElementById('studentFilter');
    if (!studentFilter) return;

    studentFilter.innerHTML = '<option value="">All Students</option>';
    
    studentsData.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        studentFilter.appendChild(option);
    });
}

function renderResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (resultsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No results found</td>
            </tr>
        `;
        return;
    }

    resultsData.forEach(result => {
        const row = createResultRow(result);
        tbody.appendChild(row);
    });
}

function createResultRow(result) {
    const row = document.createElement('tr');
    
    const percentage = result.totalMarks > 0 ? 
        ((result.score / result.totalMarks) * 100).toFixed(1) : 0;
    
    const grade = getGrade(percentage);
    const gradeClass = getGradeClass(grade);
    
    row.innerHTML = `
        <td>${result.id}</td>
        <td>${result.quiz ? result.quiz.title : 'N/A'}</td>
        <td>${result.student ? result.student.name : 'N/A'}</td>
        <td>${result.student ? result.student.rollNo || 'N/A' : 'N/A'}</td>
        <td>${result.score}/${result.totalMarks}</td>
        <td>
            <div class="score-percentage">
                <div class="percentage-bar">
                    <div class="percentage-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="percentage-text">${percentage}%</span>
            </div>
        </td>
        <td><span class="grade ${gradeClass}">${grade}</span></td>
        <td>${formatDate(result.createdAt)}</td>
        <td>
            <button class="btn btn-sm btn-outline" onclick="viewResult(${result.id})" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-primary" onclick="downloadResult(${result.id})" title="Download">
                <i class="fas fa-download"></i>
            </button>
        </td>
    `;
    
    return row;
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
}

function getGradeClass(grade) {
    const classes = {
        'A+': 'grade-excellent',
        'A': 'grade-excellent',
        'B+': 'grade-good',
        'B': 'grade-good',
        'C+': 'grade-average',
        'C': 'grade-average',
        'D': 'grade-pass',
        'F': 'grade-fail'
    };
    return classes[grade] || 'grade-average';
}

function updateResultsSummary() {
    const totalAttempts = resultsData.length;
    const averageScore = totalAttempts > 0 ? 
        (resultsData.reduce((sum, result) => sum + (result.score || 0), 0) / totalAttempts).toFixed(1) : 0;
    const highestScore = totalAttempts > 0 ? 
        Math.max(...resultsData.map(r => r.score || 0)) : 0;
    const passCount = resultsData.filter(r => {
        const percentage = r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0;
        return percentage >= 33;
    }).length;
    const passRate = totalAttempts > 0 ? ((passCount / totalAttempts) * 100).toFixed(1) : 0;
    
    // Update summary cards
    updateSummaryCard('totalAttempts', totalAttempts);
    updateSummaryCard('averageScore', averageScore);
    updateSummaryCard('highestScore', highestScore);
    updateSummaryCard('passRate', passRate + '%');
}

function updateSummaryCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function viewResult(resultId) {
    const result = resultsData.find(r => r.id === resultId);
    if (!result) return;
    
    showResultModal(result);
}

function showResultModal(result) {
    const percentage = result.totalMarks > 0 ? 
        ((result.score / result.totalMarks) * 100).toFixed(1) : 0;
    const grade = getGrade(percentage);
    const gradeClass = getGradeClass(grade);
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Quiz Result Details</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="result-detail">
                        <div class="result-header">
                            <div class="result-info">
                                <h4>${result.quiz ? result.quiz.title : 'N/A'}</h4>
                                <span class="quiz-difficulty ${getDifficultyColor(result.quiz?.difficulty)}">
                                    ${result.quiz?.difficulty || 'N/A'}
                                </span>
                            </div>
                            <div class="result-score-large">
                                <span class="score-value">${result.score}</span>
                                <span class="score-total">/ ${result.totalMarks}</span>
                                <span class="score-percentage">${percentage}%</span>
                                <span class="grade ${gradeClass}">${grade}</span>
                            </div>
                        </div>
                        <div class="result-details">
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Student Name:</label>
                                    <span>${result.student ? result.student.name : 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Roll Number:</label>
                                    <span>${result.student ? result.student.rollNo || 'N/A' : 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Class:</label>
                                    <span>${result.quiz?.classEntity ? result.quiz.classEntity.className : 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Division:</label>
                                    <span>${result.quiz?.division ? result.quiz.division.divisionName : 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Teacher:</label>
                                    <span>${result.quiz?.teacher ? result.quiz.teacher.name : 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Attempt Date:</label>
                                    <span>${formatDateTime(result.createdAt)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Total Questions:</label>
                                    <span>${result.totalQuestions || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Correct Answers:</label>
                                    <span>${result.correctAnswers || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Time Taken:</label>
                                    <span>${result.timeTaken || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status:</label>
                                    <span class="status-badge ${percentage >= 33 ? 'status-pass' : 'status-fail'}">
                                        ${percentage >= 33 ? 'Pass' : 'Fail'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="performance-chart">
                            <h4>Performance Overview</h4>
                            <div class="chart-container">
                                <div class="score-chart">
                                    <div class="chart-bar" style="height: ${percentage}%"></div>
                                    <span class="chart-label">${percentage}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>
                            <button type="button" class="btn btn-primary" onclick="downloadResult(${result.id})">
                                <i class="fas fa-download"></i> Download Result
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

function getDifficultyColor(difficulty) {
    const colors = {
        'EASY': 'difficulty-easy',
        'MEDIUM': 'difficulty-medium',
        'HARD': 'difficulty-hard'
    };
    return colors[difficulty] || 'difficulty-medium';
}

function downloadResult(resultId) {
    const result = resultsData.find(r => r.id === resultId);
    if (!result) return;
    
    try {
        // Create result data for export
        const exportData = {
            studentName: result.student?.name || 'N/A',
            rollNumber: result.student?.rollNo || 'N/A',
            quizTitle: result.quiz?.title || 'N/A',
            score: result.score || 0,
            totalMarks: result.totalMarks || 0,
            percentage: result.totalMarks > 0 ? ((result.score / result.totalMarks) * 100).toFixed(1) : 0,
            grade: getGrade(result.totalMarks > 0 ? ((result.score / result.totalMarks) * 100) : 0),
            attemptDate: result.createdAt || 'N/A',
            totalQuestions: result.totalQuestions || 0,
            correctAnswers: result.correctAnswers || 0,
            timeTaken: result.timeTaken || 'N/A',
            class: result.quiz?.classEntity?.className || 'N/A',
            division: result.quiz?.division?.divisionName || 'N/A',
            teacher: result.quiz?.teacher?.name || 'N/A'
        };
        
        // Create CSV content
        const csvContent = generateResultCSV(exportData);
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_result_${result.student?.name || 'unknown'}_${result.quiz?.title || 'unknown'}_${formatDate(result.createdAt)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Result downloaded successfully', 'success');
        
    } catch (error) {
        console.error('Download result error:', error);
        showToast('Failed to download result', 'error');
    }
}

function generateResultCSV(resultData) {
    const headers = ['Student Name', 'Roll Number', 'Quiz Title', 'Score', 'Total Marks', 'Percentage', 'Grade', 'Attempt Date', 'Total Questions', 'Correct Answers', 'Time Taken', 'Class', 'Division', 'Teacher'];
    const row = [
        resultData.studentName,
        resultData.rollNumber,
        resultData.quizTitle,
        resultData.score,
        resultData.totalMarks,
        resultData.percentage,
        resultData.grade,
        resultData.attemptDate,
        resultData.totalQuestions,
        resultData.correctAnswers,
        resultData.timeTaken,
        resultData.class,
        resultData.division,
        resultData.teacher
    ];
    
    const csvContent = [
        headers.join(','),
        row.join(',')
    ].join('\n');
    
    return csvContent;
}

async function exportResults() {
    if (resultsData.length === 0) {
        showToast('No results to export', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        // Create CSV content for all results
        const headers = ['Result ID', 'Student Name', 'Roll Number', 'Quiz Title', 'Score', 'Total Marks', 'Percentage', 'Grade', 'Attempt Date', 'Class', 'Division', 'Teacher'];
        const rows = resultsData.map(result => {
            const percentage = result.totalMarks > 0 ? ((result.score / result.totalMarks) * 100).toFixed(1) : 0;
            const grade = getGrade(percentage);
            
            return [
                result.id,
                result.student?.name || 'N/A',
                result.student?.rollNo || 'N/A',
                result.quiz?.title || 'N/A',
                result.score || 0,
                result.totalMarks || 0,
                percentage,
                grade,
                formatDate(result.createdAt),
                result.quiz?.classEntity?.className || 'N/A',
                result.quiz?.division?.divisionName || 'N/A',
                result.quiz?.teacher?.name || 'N/A'
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_results_${formatDate(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Results exported successfully', 'success');
        
    } catch (error) {
        console.error('Export results error:', error);
        showToast('Failed to export results', 'error');
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
    
    const filteredData = resultsData.filter(result => 
        (result.quiz && result.quiz.title.toLowerCase().includes(searchTerm)) ||
        (result.student && result.student.name.toLowerCase().includes(searchTerm)) ||
        (result.student && result.student.rollNo && result.student.rollNo.toLowerCase().includes(searchTerm))
    );
    
    renderFilteredResults(filteredData);
}

function handleFilters() {
    const quizFilter = document.getElementById('quizFilter')?.value;
    const difficultyFilter = document.getElementById('difficultyFilter')?.value;
    const dateFilter = document.getElementById('dateFilter')?.value;
    
    let filteredData = resultsData;
    
    if (quizFilter) {
        filteredData = filteredData.filter(result => 
            result.quiz && result.quiz.id.toString() === quizFilter
        );
    }
    
    if (difficultyFilter) {
        filteredData = filteredData.filter(result => 
            result.quiz && result.quiz.difficulty === difficultyFilter
        );
    }
    
    if (dateFilter) {
        const today = new Date();
        let filterDate;
        
        switch (dateFilter) {
            case 'today':
                filterDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                filterDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                filterDate = monthAgo.toISOString().split('T')[0];
                break;
            default:
                filterDate = null;
        }
        
        if (filterDate) {
            filteredData = filteredData.filter(result => 
                result.createdAt && result.createdAt >= filterDate
            );
        }
    }
    
    renderFilteredResults(filteredData);
}

function renderFilteredResults(filteredData) {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No results found matching your criteria</td>
            </tr>
        `;
        return;
    }

    filteredData.forEach(result => {
        const row = createResultRow(result);
        tbody.appendChild(row);
    });
}
