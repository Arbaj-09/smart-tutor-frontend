// ===== QUIZ PAGE =====

// Global variables
let quizzesData = [];
let classesData = [];
let divisionsData = [];
let currentQuiz = null;
let currentAttempt = null;
let quizTimer = null;
let timeRemaining = 0;
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadSidebar();
    loadClasses();
    loadDivisions();
    loadQuizzes();
    bindEventListeners();
    updateUserInfo(getCurrentUser());
}

function bindEventListeners() {
    // Create quiz button
    const createBtn = document.getElementById('createQuizBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
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

    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', handleFilters);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilters);
    }

    // Modal close handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
            stopQuizTimer();
        }
        if (e.target.classList.contains('modal-close')) {
            closeModal();
            stopQuizTimer();
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

async function loadQuizzes() {
    try {
        showLoading();
        const response = await commonAPI.getQuizzes();
        quizzesData = response || [];
        renderQuizzesGrid();
    } catch (error) {
        console.error('Load quizzes error:', error);
        showToast('Failed to load quizzes', 'error');
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

function renderQuizzesGrid() {
    const gridContainer = document.getElementById('quizzesGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (quizzesData.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <h3>No Quizzes Found</h3>
                <p>No quizzes have been created yet. Click the "Create Quiz" button to add your first quiz.</p>
            </div>
        `;
        return;
    }

    quizzesData.forEach(quiz => {
        const quizCard = createQuizCard(quiz);
        gridContainer.appendChild(quizCard);
    });
}

function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    
    const difficultyColor = getDifficultyColor(quiz.difficulty);
    const userRole = getUserRole();
    const canAttempt = userRole === 'STUDENT';
    const canManage = userRole === 'TEACHER' || userRole === 'HOD';
    
    card.innerHTML = `
        <div class="quiz-header">
            <div class="quiz-info">
                <h4 class="quiz-title">${quiz.title}</h4>
                <span class="quiz-difficulty ${difficultyColor}">${quiz.difficulty}</span>
            </div>
            <div class="quiz-meta">
                <span class="quiz-time"><i class="fas fa-clock"></i> ${quiz.timeLimit} min</span>
                <span class="quiz-questions"><i class="fas fa-list"></i> ${quiz.questions ? quiz.questions.length : 0} questions</span>
            </div>
        </div>
        <div class="quiz-content">
            <div class="quiz-details">
                <span class="quiz-class">${quiz.classEntity ? quiz.classEntity.className : 'N/A'}</span>
                <span class="quiz-division">${quiz.division ? quiz.division.divisionName : 'N/A'}</span>
                <span class="quiz-teacher">${quiz.teacher ? quiz.teacher.name : 'N/A'}</span>
            </div>
            <div class="quiz-date">
                Created: ${formatDate(quiz.createdAt)}
            </div>
        </div>
        <div class="quiz-actions">
            ${canAttempt ? `<button class="btn btn-primary" onclick="attemptQuiz(${quiz.id})">Attempt Quiz</button>` : ''}
            ${canManage ? `
                <button class="btn btn-sm btn-outline" onclick="viewQuiz(${quiz.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editQuiz(${quiz.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteQuiz(${quiz.id}, '${quiz.title}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

function getDifficultyColor(difficulty) {
    const colors = {
        'EASY': 'difficulty-easy',
        'MEDIUM': 'difficulty-medium',
        'HARD': 'difficulty-hard'
    };
    return colors[difficulty] || 'difficulty-medium';
}

function showCreateModal() {
    populateClassFilters();
    populateDivisionFilters();
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal large-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Quiz</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="createQuizForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="quizTitle">Quiz Title *</label>
                                <input type="text" id="quizTitle" name="title" required 
                                       placeholder="Enter quiz title">
                            </div>
                            <div class="form-group">
                                <label for="quizDifficulty">Difficulty *</label>
                                <select id="quizDifficulty" name="difficulty" required>
                                    <option value="">Select Difficulty</option>
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="quizTimeLimit">Time Limit (minutes) *</label>
                                <input type="number" id="quizTimeLimit" name="timeLimit" required 
                                       min="1" max="180" placeholder="30">
                            </div>
                        </div>
                        <div class="form-row">
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
                        </div>
                        <div class="questions-section">
                            <h4>Questions</h4>
                            <div id="questionsContainer">
                                <div class="question-item">
                                    <div class="question-header">
                                        <span>Question 1</span>
                                        <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(this)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="form-group">
                                        <label>Question Text *</label>
                                        <input type="text" name="questionText" required placeholder="Enter question">
                                    </div>
                                    <div class="options-grid">
                                        <div class="form-group">
                                            <label>Option A *</label>
                                            <input type="text" name="optionA" required placeholder="Option A">
                                        </div>
                                        <div class="form-group">
                                            <label>Option B *</label>
                                            <input type="text" name="optionB" required placeholder="Option B">
                                        </div>
                                        <div class="form-group">
                                            <label>Option C *</label>
                                            <input type="text" name="optionC" required placeholder="Option C">
                                        </div>
                                        <div class="form-group">
                                            <label>Option D *</label>
                                            <input type="text" name="optionD" required placeholder="Option D">
                                        </div>
                                        <div class="form-group">
                                            <label>Correct Answer *</label>
                                            <select name="correctOption" required>
                                                <option value="">Select</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-outline" onclick="addQuestion()">
                                <i class="fas fa-plus"></i> Add Question
                            </button>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Quiz</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
    populateClassFilters();
    populateDivisionFilters();
    document.getElementById('createQuizForm').addEventListener('submit', handleCreateQuiz);
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const questionCount = container.children.length + 1;
    
    const questionHTML = `
        <div class="question-item">
            <div class="question-header">
                <span>Question ${questionCount}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="form-group">
                <label>Question Text *</label>
                <input type="text" name="questionText" required placeholder="Enter question">
            </div>
            <div class="options-grid">
                <div class="form-group">
                    <label>Option A *</label>
                    <input type="text" name="optionA" required placeholder="Option A">
                </div>
                <div class="form-group">
                    <label>Option B *</label>
                    <input type="text" name="optionB" required placeholder="Option B">
                </div>
                <div class="form-group">
                    <label>Option C *</label>
                    <input type="text" name="optionC" required placeholder="Option C">
                </div>
                <div class="form-group">
                    <label>Option D *</label>
                    <input type="text" name="optionD" required placeholder="Option D">
                </div>
                <div class="form-group">
                    <label>Correct Answer *</label>
                    <select name="correctOption" required>
                        <option value="">Select</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.remove();
    
    // Update question numbers
    const container = document.getElementById('questionsContainer');
    const questions = container.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const header = question.querySelector('.question-header span');
        header.textContent = `Question ${index + 1}`;
    });
}

async function handleCreateQuiz(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const questions = [];
    
    // Collect questions
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach(item => {
        const questionText = item.querySelector('input[name="questionText"]').value;
        const optionA = item.querySelector('input[name="optionA"]').value;
        const optionB = item.querySelector('input[name="optionB"]').value;
        const optionC = item.querySelector('input[name="optionC"]').value;
        const optionD = item.querySelector('input[name="optionD"]').value;
        const correctOption = item.querySelector('select[name="correctOption"]').value;
        
        if (questionText && optionA && optionB && optionC && optionD && correctOption) {
            questions.push({
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctOption
            });
        }
    });
    
    if (questions.length === 0) {
        showToast('Please add at least one question', 'error');
        return;
    }
    
    const quizData = {
        title: formData.get('title').trim(),
        difficulty: formData.get('difficulty'),
        timeLimit: parseInt(formData.get('timeLimit')),
        classId: parseInt(formData.get('classId')),
        divisionId: parseInt(formData.get('divisionId')),
        questions
    };
    
    if (!quizData.title || !quizData.difficulty || !quizData.timeLimit || !quizData.classId || !quizData.divisionId) {
        showToast('All required fields must be filled', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await commonAPI.createQuiz(quizData);
        
        showToast('Quiz created successfully', 'success');
        closeModal();
        loadQuizzes(); // Refresh data
        
    } catch (error) {
        console.error('Create quiz error:', error);
        showToast(error.message || 'Failed to create quiz', 'error');
    } finally {
        hideLoading();
    }
}

async function attemptQuiz(quizId) {
    const quiz = quizzesData.find(q => q.id === quizId);
    if (!quiz) return;
    
    try {
        showLoading();
        
        // Get current user
        const user = getCurrentUser();
        if (!user || user.role !== 'STUDENT') {
            showToast('Only students can attempt quizzes', 'error');
            return;
        }
        
        // Create quiz attempt
        const attemptData = { studentId: user.id };
        const attempt = await commonAPI.attemptQuiz(quizId, attemptData);
        
        currentAttempt = attempt;
        currentQuiz = quiz;
        
        // Show quiz attempt modal
        showQuizAttemptModal(quiz, attempt);
        
    } catch (error) {
        console.error('Attempt quiz error:', error);
        showToast(error.message || 'Failed to start quiz', 'error');
    } finally {
        hideLoading();
    }
}

function showQuizAttemptModal(quiz, attempt) {
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal quiz-modal">
                <div class="modal-header">
                    <h3 class="modal-title">${quiz.title}</h3>
                    <div class="quiz-timer">
                        <i class="fas fa-clock"></i>
                        <span id="timerDisplay">${quiz.timeLimit}:00</span>
                    </div>
                    <button class="modal-close" onclick="closeQuizAttempt()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="quiz-info">
                        <span class="quiz-difficulty ${getDifficultyColor(quiz.difficulty)}">${quiz.difficulty}</span>
                        <span class="quiz-questions-count">${quiz.questions ? quiz.questions.length : 0} questions</span>
                    </div>
                    <div id="quizQuestionsContainer">
                        <!-- Questions will be loaded here -->
                    </div>
                    <div class="quiz-actions">
                        <button type="button" class="btn btn-outline" onclick="closeQuizAttempt()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitQuiz()">Submit Quiz</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
    
    // Load quiz questions
    loadQuizQuestions(quiz.id);
    
    // Start timer
    startQuizTimer(quiz.timeLimit);
}

async function loadQuizQuestions(quizId) {
    try {
        const questions = await commonAPI.getQuizQuestions(quizId);
        renderQuizQuestions(questions);
    } catch (error) {
        console.error('Load questions error:', error);
        showToast('Failed to load questions', 'error');
    }
}

function renderQuizQuestions(questions) {
    const container = document.getElementById('quizQuestionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionHTML = `
            <div class="quiz-question">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                </div>
                <div class="question-text">${question.questionText}</div>
                <div class="question-options">
                    <label class="option-label">
                        <input type="radio" name="question_${question.id}" value="A">
                        <span class="option-text">A. ${question.optionA}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="question_${question.id}" value="B">
                        <span class="option-text">B. ${question.optionB}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="question_${question.id}" value="C">
                        <span class="option-text">C. ${question.optionC}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="question_${question.id}" value="D">
                        <span class="option-text">D. ${question.optionD}</span>
                    </label>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', questionHTML);
    });
}

function startQuizTimer(minutes) {
    timeRemaining = minutes * 60; // Convert to seconds
    
    quizTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeRemaining <= 0) {
            stopQuizTimer();
            submitQuiz();
        }
    }, 1000);
}

function stopQuizTimer() {
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
}

async function submitQuiz() {
    if (!currentQuiz || !currentAttempt) return;
    
    // Collect answers
    const answers = {};
    const questionInputs = document.querySelectorAll('input[type="radio"]:checked');
    
    questionInputs.forEach(input => {
        const questionId = input.name.split('_')[1];
        answers[questionId] = input.value;
    });
    
    // Check if all questions are answered
    const totalQuestions = document.querySelectorAll('.quiz-question').length;
    if (Object.keys(answers).length < totalQuestions) {
        const confirmed = confirm('You have not answered all questions. Are you sure you want to submit?');
        if (!confirmed) return;
    }
    
    try {
        showLoading();
        stopQuizTimer();
        
        const user = getCurrentUser();
        const submissionData = {
            studentId: user.id,
            answers
        };
        
        const result = await commonAPI.submitQuiz(currentQuiz.id, submissionData);
        
        showQuizResultModal(result);
        
    } catch (error) {
        console.error('Submit quiz error:', error);
        showToast(error.message || 'Failed to submit quiz', 'error');
    } finally {
        hideLoading();
    }
}

function showQuizResultModal(result) {
    const percentage = result.totalMarks > 0 ? 
        ((result.score / result.totalMarks) * 100).toFixed(1) : 0;
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal result-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Quiz Result</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="result-summary">
                        <div class="result-score">
                            <h4>Your Score</h4>
                            <div class="score-display">
                                <span class="score-value">${result.score}</span>
                                <span class="score-total">/ ${result.totalMarks}</span>
                            </div>
                            <div class="score-percentage">${percentage}%</div>
                        </div>
                        <div class="result-details">
                            <div class="detail-item">
                                <label>Total Questions:</label>
                                <span>${result.totalQuestions || 0}</span>
                            </div>
                            <div class="detail-item">
                                <label>Correct Answers:</label>
                                <span>${result.correctAnswers || 0}</span>
                            </div>
                            <div class="detail-item">
                                <label>Time Taken:</label>
                                <span>${result.timeTaken || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

function closeQuizAttempt() {
    if (confirm('Are you sure you want to cancel the quiz? Your progress will be lost.')) {
        stopQuizTimer();
        closeModal();
    }
}

function viewQuiz(quizId) {
    const quiz = quizzesData.find(q => q.id === quizId);
    if (!quiz) return;
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Quiz Details</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="quiz-detail">
                        <div class="detail-header">
                            <h4>${quiz.title}</h4>
                            <span class="quiz-difficulty ${getDifficultyColor(quiz.difficulty)}">${quiz.difficulty}</span>
                        </div>
                        <div class="detail-meta">
                            <div class="meta-item">
                                <label>Time Limit:</label>
                                <span>${quiz.timeLimit} minutes</span>
                            </div>
                            <div class="meta-item">
                                <label>Class:</label>
                                <span>${quiz.classEntity ? quiz.classEntity.className : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Division:</label>
                                <span>${quiz.division ? quiz.division.divisionName : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Teacher:</label>
                                <span>${quiz.teacher ? quiz.teacher.name : 'N/A'}</span>
                            </div>
                            <div class="meta-item">
                                <label>Questions:</label>
                                <span>${quiz.questions ? quiz.questions.length : 0}</span>
                            </div>
                            <div class="meta-item">
                                <label>Created:</label>
                                <span>${formatDateTime(quiz.createdAt)}</span>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>
                            <button type="button" class="btn btn-primary" onclick="editQuiz(${quiz.id})">Edit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
}

function editQuiz(quizId) {
    // Implementation for editing quiz
    showToast('Edit quiz functionality coming soon', 'info');
}

function deleteQuiz(quizId, quizTitle) {
    showConfirmModal(
        `Are you sure you want to delete quiz "${quizTitle}"? This action cannot be undone.`,
        () => {
            performDelete(quizId);
        },
        {
            title: 'Delete Quiz',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        }
    );
}

async function performDelete(quizId) {
    showLoading();
    
    try {
        await commonAPI.deleteQuiz(quizId);
        
        showToast('Quiz deleted successfully', 'success');
        loadQuizzes(); // Refresh data
        
    } catch (error) {
        console.error('Delete quiz error:', error);
        showToast(error.message || 'Failed to delete quiz', 'error');
    } finally {
        hideLoading();
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
    stopQuizTimer();
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    const filteredData = quizzesData.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm) ||
        quiz.difficulty.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredQuizzes(filteredData);
}

function handleFilters() {
    const classFilter = document.getElementById('classFilter')?.value;
    const divisionFilter = document.getElementById('divisionFilter')?.value;
    const difficultyFilter = document.getElementById('difficultyFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    
    let filteredData = quizzesData;
    
    if (classFilter) {
        filteredData = filteredData.filter(quiz => 
            quiz.classEntity && quiz.classEntity.id.toString() === classFilter
        );
    }
    
    if (divisionFilter) {
        filteredData = filteredData.filter(quiz => 
            quiz.division && quiz.division.id.toString() === divisionFilter
        );
    }
    
    if (difficultyFilter) {
        filteredData = filteredData.filter(quiz => quiz.difficulty === difficultyFilter);
    }
    
    renderFilteredQuizzes(filteredData);
}

function renderFilteredQuizzes(filteredData) {
    const gridContainer = document.getElementById('quizzesGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (filteredData.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Quizzes Found</h3>
                <p>No quizzes match your search criteria.</p>
            </div>
        `;
        return;
    }

    filteredData.forEach(quiz => {
        const quizCard = createQuizCard(quiz);
        gridContainer.appendChild(quizCard);
    });
}
