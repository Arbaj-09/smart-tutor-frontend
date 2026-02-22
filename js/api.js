// ===== CENTRAL API HANDLER - NO SECURITY, NO SESSIONS =====

const API_BASE_URL = 'http://localhost:8082';
const API_PREFIX = '/api';

// Global fetch wrapper with error handling - NO CREDENTIALS
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// HTTP Methods
const api = {
    get: (endpoint, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return apiRequest(url);
    },
    
    post: (endpoint, data = {}) => {
        return apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    put: (endpoint, data = {}) => {
        return apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    delete: (endpoint) => {
        return apiRequest(endpoint, {
            method: 'DELETE',
        });
    },
    
    upload: (endpoint, formData) => {
        return apiRequest(endpoint, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    },
};

// ===== AUTHENTICATION API - SIMPLE LOGIN =====
const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    registerHOD: (hodData) => api.post('/auth/register-hod', hodData),
};

// ===== HOD API - NO SECURITY =====
const hodAPI = {
    getDashboardStats: () => api.get(`${API_PREFIX}/hod/dashboard`),
    
    // Classes
    getAllClasses: () => api.get(`${API_PREFIX}/hod/classes`),
    createClass: (classData) => api.post(`${API_PREFIX}/hod/class`, classData),
    
    // Divisions
    getAllDivisions: () => api.get(`${API_PREFIX}/hod/divisions`),
    createDivision: (divisionData) => api.post(`${API_PREFIX}/hod/division`, divisionData),
    getDivisionsByClass: (classId) => api.get(`${API_PREFIX}/hod/divisions/class/${classId}`),
    
    // Teachers
    getAllTeachers: () => api.get(`${API_PREFIX}/hod/teachers`),
    createTeacher: (teacherData) => api.post(`${API_PREFIX}/hod/teacher`, teacherData),
    updateTeacher: (id, teacherData) => api.put(`${API_PREFIX}/hod/teachers/${id}`, teacherData),
    deleteTeacher: (id) => api.delete(`${API_PREFIX}/hod/teachers/${id}`),
    
    // Students
    getAllStudents: () => api.get(`${API_PREFIX}/hod/students`),
    getStudentsByClassAndDivision: (classId, divisionId) => 
        api.get(`${API_PREFIX}/hod/students/class/${classId}/division/${divisionId}`),
    
    // Activity Logs
    getActivityLogs: () => api.get(`${API_PREFIX}/hod/activity-logs`),
};

// ===== TEACHER API - NO SECURITY =====
const teacherAPI = {
    getDashboardStats: () => api.get(`${API_PREFIX}/teacher/dashboard`),
    
    // Students
    getAssignedStudents: () => api.get(`${API_PREFIX}/teacher/students`),
    createStudent: (studentData) => api.post(`${API_PREFIX}/teacher/students`, studentData),
    updateStudent: (id, studentData) => api.put(`${API_PREFIX}/teacher/students/${id}`, studentData),
    deleteStudent: (id) => api.delete(`${API_PREFIX}/teacher/students/${id}`),
};

// ===== STUDENT API - NO SECURITY =====
const studentAPI = {
    getDashboardStats: () => api.get(`${API_PREFIX}/student/dashboard`),
};

// ===== COMMON API - NO SECURITY =====
const commonAPI = {
    // Classes
    getClasses: () => api.get(`${API_PREFIX}/classes`),
    getClass: (id) => api.get(`${API_PREFIX}/classes/${id}`),
    createClass: (classData) => api.post(`${API_PREFIX}/classes`, classData),
    updateClass: (id, classData) => api.put(`${API_PREFIX}/classes/${id}`, classData),
    deleteClass: (id) => api.delete(`${API_PREFIX}/classes/${id}`),
    
    // Divisions
    getDivisions: () => api.get(`${API_PREFIX}/divisions`),
    getDivision: (id) => api.get(`${API_PREFIX}/divisions/${id}`),
    createDivision: (divisionData) => api.post(`${API_PREFIX}/divisions`, divisionData),
    updateDivision: (id, divisionData) => api.put(`${API_PREFIX}/divisions/${id}`, divisionData),
    deleteDivision: (id) => api.delete(`${API_PREFIX}/divisions/${id}`),
    
    // Teachers
    getTeachers: () => api.get(`${API_PREFIX}/teachers`),
    getTeacher: (id) => api.get(`${API_PREFIX}/teachers/${id}`),
    
    // Students
    getStudents: () => api.get(`${API_PREFIX}/students`),
    getStudent: (id) => api.get(`${API_PREFIX}/students/${id}`),
    
    // Attendance
    getAttendance: (params = {}) => api.get(`${API_PREFIX}/attendance`, params),
    markAttendance: (attendanceData) => api.post(`${API_PREFIX}/attendance/mark`, attendanceData),
    
    // Notes
    getNotes: (params = {}) => api.get(`${API_PREFIX}/notes`, params),
    uploadNote: (formData) => api.upload(`${API_PREFIX}/notes/upload`, formData),
    
    // Quizzes
    getQuizzes: (params = {}) => api.get(`${API_PREFIX}/quiz`, params),
    createQuiz: (quizData) => api.post(`${API_PREFIX}/quiz/create`, quizData),
    
    // Notifications
    getNotifications: (params = {}) => api.get(`${API_PREFIX}/notifications`, params),
    getUnreadNotificationCount: (role, userId) => api.get(`${API_PREFIX}/notifications/unread/count/role/${role}/user/${userId}`),
    markNotificationAsRead: (notificationId) => api.post(`${API_PREFIX}/notifications/${notificationId}/read`),
    deleteNotification: (notificationId) => api.delete(`${API_PREFIX}/notifications/${notificationId}`),
    clearAllNotifications: () => api.delete(`${API_PREFIX}/notifications/clear-all`),
    
    // Activity Logs
    getActivityLogs: (params = {}) => api.get(`${API_PREFIX}/activity-logs`, params),
};

// ===== UTILITY FUNCTIONS - SIMPLE LOCAL STORAGE =====

// Get current user from storage
function getCurrentUser() {
    const local = localStorage.getItem('user');
    if (local) {
        try {
            return JSON.parse(local);
        } catch (e) {
            localStorage.removeItem('user');
        }
    }
    return null;
}

// Check if user is authenticated
function isAuthenticated() {
    const user = getCurrentUser();
    return user && user.role && user.id;
}

// Get user role
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Check if user has specific role
function hasRole(role) {
    const userRole = getUserRole();
    return userRole === role;
}

// Check if user is HOD
function isHOD() {
    return hasRole('HOD');
}

// Check if user is Teacher
function isTeacher() {
    return hasRole('TEACHER');
}

// Check if user is Student
function isStudent() {
    return hasRole('STUDENT');
}

// Redirect based on role
function redirectToDashboard(role) {
    const dashboardMap = {
        'HOD': '/dashboard/hod-dashboard.html',
        'TEACHER': '/dashboard/teacher-dashboard.html',
        'STUDENT': '/dashboard/student-dashboard.html',
    };
    
    const dashboard = dashboardMap[role];
    if (dashboard) {
        window.location.href = dashboard;
    } else {
        window.location.href = '/index.html';
    }
}

// Handle authentication errors
function handleAuthError(error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/index.html';
    }
}

// Show loading
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

// Hide loading
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        // Create container if it doesn't exist
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format date time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export for use in other modules
window.api = api;
window.authAPI = authAPI;
window.hodAPI = hodAPI;
window.teacherAPI = teacherAPI;
window.studentAPI = studentAPI;
window.commonAPI = commonAPI;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.getUserRole = getUserRole;
window.hasRole = hasRole;
window.isHOD = isHOD;
window.isTeacher = isTeacher;
window.isStudent = isStudent;
window.redirectToDashboard = redirectToDashboard;
window.handleAuthError = handleAuthError;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
