// ===== CENTRALIZED API HANDLER =====

window.API_BASE_URL = 'http://localhost:8082';

class ApiHandler {
    constructor() {
        this.init();
    }

    init() {
        // Set up global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled API error:', event.reason);
            toastSystem.error('An unexpected error occurred');
        });
    }

    async request(endpoint, options = {}) {
        const url = `${window.API_BASE_URL}${endpoint}`;
        
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

    // HTTP methods
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }
    
    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    
    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }
    
    upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }
}

// Global instance
window.apiHandler = new ApiHandler();

// API endpoints organized by role
window.api = {
    // Authentication
    auth: {
        login: (credentials) => apiHandler.post('/auth/login', credentials),
        logout: () => apiHandler.post('/auth/logout'),
        registerHOD: (hodData) => apiHandler.post('/auth/register-hod', hodData),
    },
    
    // HOD endpoints
    hod: {
        dashboard: () => apiHandler.get('/api/hod/dashboard'),
        classes: {
            getAll: () => apiHandler.get('/api/hod/classes'),
            create: (data) => apiHandler.post('/api/hod/class', data),
            update: (id, data) => apiHandler.put(`/api/hod/classes/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/hod/classes/${id}`),
        },
        divisions: {
            getAll: () => apiHandler.get('/api/hod/divisions'),
            create: (data) => apiHandler.post('/api/hod/division', data),
            update: (id, data) => apiHandler.put(`/api/hod/divisions/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/hod/divisions/${id}`),
            getByClass: (classId) => apiHandler.get(`/api/hod/divisions/class/${classId}`),
        },
        teachers: {
            getAll: () => apiHandler.get('/api/hod/teachers'),
            create: (data) => apiHandler.post('/api/hod/teacher', data),
            update: (id, data) => apiHandler.put(`/api/hod/teachers/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/hod/teachers/${id}`),
        },
        students: {
            getAll: () => apiHandler.get('/api/hod/students'),
            create: (data) => apiHandler.post('/api/hod/students', data),
            update: (id, data) => apiHandler.put(`/api/hod/students/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/hod/students/${id}`),
            getByClassAndDivision: (classId, divisionId) => 
                apiHandler.get(`/api/hod/students/class/${classId}/division/${divisionId}`),
        },
        activityLogs: () => apiHandler.get('/api/hod/activity-logs'),
    },
    
    // Teacher endpoints
    teacher: {
        dashboard: () => {
            // Get user ID from stored user data
            const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
            if (!userStr) {
                throw new Error('User not found. Please login again.');
            }
            
            let user;
            try {
                user = JSON.parse(userStr);
            } catch (error) {
                throw new Error('Invalid user data. Please login again.');
            }
            
            const userId = user.userId || user.id;
            if (!userId || userId === 'null' || userId === 'undefined') {
                throw new Error('Teacher ID not found. Please login again.');
            }
            
            return apiHandler.get(`/api/teachers/${userId}/dashboard`);
        },
        students: {
            getAssigned: () => {
                const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
                if (!userStr) {
                    throw new Error('User not found. Please login again.');
                }
                
                let user;
                try {
                    user = JSON.parse(userStr);
                } catch (error) {
                    throw new Error('Invalid user data. Please login again.');
                }
                
                const userId = user.userId || user.id;
                if (!userId || userId === 'null' || userId === 'undefined') {
                    throw new Error('Teacher ID not found. Please login again.');
                }
                
                return apiHandler.get(`/api/teachers/${userId}/students`);
            },
            create: (data) => {
                const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
                if (!userStr) {
                    throw new Error('User not found. Please login again.');
                }
                
                let user;
                try {
                    user = JSON.parse(userStr);
                } catch (error) {
                    throw new Error('Invalid user data. Please login again.');
                }
                
                const userId = user.userId || user.id;
                if (!userId || userId === 'null' || userId === 'undefined') {
                    throw new Error('Teacher ID not found. Please login again.');
                }
                
                return apiHandler.post(`/api/teachers/${userId}/students`, data);
            },
            update: (id, data) => {
                const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
                if (!userStr) {
                    throw new Error('User not found. Please login again.');
                }
                
                let user;
                try {
                    user = JSON.parse(userStr);
                } catch (error) {
                    throw new Error('Invalid user data. Please login again.');
                }
                
                const userId = user.userId || user.id;
                if (!userId || userId === 'null' || userId === 'undefined') {
                    throw new Error('Teacher ID not found. Please login again.');
                }
                
                return apiHandler.put(`/api/teachers/${userId}/students/${id}`, data);
            },
            delete: (id) => {
                const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
                if (!userStr) {
                    throw new Error('User not found. Please login again.');
                }
                
                let user;
                try {
                    user = JSON.parse(userStr);
                } catch (error) {
                    throw new Error('Invalid user data. Please login again.');
                }
                
                const userId = user.userId || user.id;
                if (!userId || userId === 'null' || userId === 'undefined') {
                    throw new Error('Teacher ID not found. Please login again.');
                }
                
                return apiHandler.delete(`/api/teachers/${userId}/students/${id}`);
            },
        },
    },
    
    // Student endpoints
    student: {
        dashboard: () => apiHandler.get('/api/student/dashboard'),
    },
    
    // Common endpoints
    common: {
        attendance: {
            getAll: () => apiHandler.get('/api/attendance'),
            mark: (data) => apiHandler.post('/api/attendance/mark', data),
            getByDate: (date) => apiHandler.get(`/api/attendance/date/${date}`),
            getByStudent: (studentId) => apiHandler.get(`/api/attendance/student/${studentId}`),
            getByTeacher: (teacherId) => apiHandler.get(`/api/attendance/teacher/${teacherId}`),
            getPercentage: (studentId) => apiHandler.get(`/api/attendance/student/${studentId}/percentage`),
        },
        quizzes: {
            getAll: () => apiHandler.get('/api/quiz'),
            getById: (id) => apiHandler.get(`/api/quiz/${id}`),
            getQuestions: (id) => apiHandler.get(`/api/quiz/${id}/questions`),
            create: (data) => apiHandler.post('/api/quiz/create', data),
            update: (id, data) => apiHandler.put(`/api/quiz/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/quiz/${id}`),
            attempt: (quizId, data) => apiHandler.post(`/api/quiz/attempt/${quizId}`, data),
            submit: (quizId, data) => apiHandler.post(`/api/quiz/submit/${quizId}`, data),
            getAttempts: (studentId) => apiHandler.get(`/api/quiz/attempts/student/${studentId}`),
        },
        notes: {
            getAll: () => apiHandler.get('/api/notes'),
            getById: (id) => apiHandler.get(`/api/notes/${id}`),
            upload: (formData) => apiHandler.upload('/api/notes/upload', formData),
            create: (data) => apiHandler.post('/api/notes', data),
            update: (id, data) => apiHandler.put(`/api/notes/${id}`, data),
            delete: (id) => apiHandler.delete(`/api/notes/${id}`),
            getByClassAndDivision: (classId, divisionId) => 
                apiHandler.get(`/api/notes/class/${classId}/division/${divisionId}`),
            getByTeacher: (teacherId) => apiHandler.get(`/api/notes/teacher/${teacherId}`),
        },
        notifications: {
            getAll: () => apiHandler.get('/api/notifications'),
            getById: (id) => apiHandler.get(`/api/notifications/${id}`),
            create: (data) => apiHandler.post('/api/notifications', data),
            getByUser: (role, userId) => apiHandler.get(`/api/notifications/role/${role}/user/${userId}`),
            getUnread: (role, userId) => apiHandler.get(`/api/notifications/unread/role/${role}/user/${userId}`),
            getUnreadCount: (role, userId) => apiHandler.get(`/api/notifications/unread/count/role/${role}/user/${userId}`),
            markAsRead: (id) => apiHandler.put(`/api/notifications/${id}/read`),
            markAllAsRead: (role, userId) => apiHandler.put(`/api/notifications/read-all/role/${role}/user/${userId}`),
            saveFCMToken: (data) => apiHandler.post('/api/notifications/fcm/token', data),
        },
        activityLogs: {
            getAll: () => apiHandler.get('/api/activity-logs'),
            getById: (id) => apiHandler.get(`/api/activity-logs/${id}`),
            getByUser: (role, userId) => apiHandler.get(`/api/activity-logs/role/${role}/user/${userId}`),
            getByRole: (role) => apiHandler.get(`/api/activity-logs/role/${role}`),
            getByAction: (action) => apiHandler.get(`/api/activity-logs/action/${action}`),
            getByDateRange: (startDate, endDate) => 
                apiHandler.get('/api/activity-logs/date-range', { startDate, endDate }),
        },
    },
};

// Utility functions
window.authUtils = {
    // User management
    getCurrentUser: () => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    saveUser: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    clearUser: () => {
        localStorage.removeItem('currentUser');
    },
    
    // Role checks
    getUserRole: () => {
        const user = authUtils.getCurrentUser();
        return user ? user.role : null;
    },
    
    isHOD: () => authUtils.getUserRole() === 'HOD',
    isTeacher: () => authUtils.getUserRole() === 'TEACHER',
    isStudent: () => authUtils.getUserRole() === 'STUDENT',
    
    // Redirect based on role
    redirectToDashboard: (role) => {
        const dashboards = {
            'HOD': 'dashboard/hod-dashboard.html',
            'TEACHER': 'dashboard/teacher-dashboard.html',
            'STUDENT': 'dashboard/student-dashboard.html'
        };
        
        const dashboard = dashboards[role];
        if (dashboard) {
            window.location.href = dashboard;
        } else {
            window.location.href = 'index.html';
        }
    },
    
    // Login
    login: async (credentials) => {
        try {
            const response = await api.auth.login(credentials);
            const user = {
                id: response.id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            
            authUtils.saveUser(user);
            authUtils.redirectToDashboard(user.role);
            
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Logout
    logout: async () => {
        try {
            await api.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            authUtils.clearUser();
            window.location.href = '../index.html';
        }
    },
};

// Date utilities
window.dateUtils = {
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatDateTime: (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatTime: (timeString) => {
        if (!timeString) return 'N/A';
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
};

// Global helper stubs (prevent crashes)
window.showGlobalLoading = window.showGlobalLoading || (() => {});
window.hideGlobalLoading = window.hideGlobalLoading || (() => {});
window.showError = window.showError || ((msg) => alert('Error: ' + msg));
window.showSuccess = window.showSuccess || ((msg) => alert('Success: ' + msg));
window.showConfirm = window.showConfirm || (async ({ message }) => confirm(message));
window.escapeHtml = window.escapeHtml || ((text) => String(text).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
window.formatDate = window.formatDate || window.dateUtils.formatDate;
window.debounce = window.debounce || ((func, wait) => { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; });
window.isValidEmail = window.isValidEmail || ((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
