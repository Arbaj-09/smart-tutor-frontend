// ===== PAGE GUARD SYSTEM =====

class PageGuard {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication on page load
        this.checkAuth();
        
        // Listen for storage changes (logout from another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser' && !e.newValue) {
                this.redirectToLogin();
            }
        });
    }

    checkAuth() {
        const user = this.getCurrentUser();
        const currentPath = window.location.pathname;
        
        // Public pages that don't require authentication
        const publicPages = [
            '/frontend/index.html',
            '/frontend/forgot-password.html'
        ];        
        const isPublicPage = publicPages.some(page => currentPath.includes(page));        
        
        if (!user && !isPublicPage) {
            this.redirectToLogin();
            return false;
        }
        
        if (user && isPublicPage) {
            // User is logged in but on login page, redirect to dashboard
            this.redirectToDashboard(user.role);
            return false;
        }
        
        if (user) {
            // Check role-based access
            return this.checkRoleAccess(user.role, currentPath);
        }
        
        return true;
    }

    getCurrentUser() {
        try {
            // Try both 'user' and 'currentUser' keys for compatibility
            let userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('currentUser');
            return null;
        }
    }

    checkRoleAccess(role, path) {
        const roleAccess = {
            'HOD': [
                '/dashboard/hod-dashboard.html',
                '/pages/manage-teachers.html',
                '/pages/manage-students.html',
                '/pages/manage-classes.html',
                '/pages/manage-divisions.html',
                '/pages/activity-log.html',
                '/pages/notifications.html',
                '/pages/notes.html',
                '/pages/attendance.html',
                '/pages/quiz.html',
                '/pages/results.html'
            ],
            'TEACHER': [
                '/dashboard/teacher-dashboard.html',
                '/pages/teacher/dashboard.html',
                '/pages/teacher/notes.html',
                '/pages/teacher/students.html',
                '/pages/manage-students.html',
                '/pages/notifications.html',
                '/pages/notes.html',
                '/pages/attendance.html',
                '/pages/quiz.html',
                '/pages/results.html'
            ],
            'STUDENT': [
                '/dashboard/student-dashboard.html',
                '/pages/student/dashboard.html',
                '/pages/student/notes.html',
                '/pages/student/profile.html',
                '/pages/notifications.html',
                '/pages/notes.html',
                '/pages/attendance.html',
                '/pages/quiz.html',
                '/pages/results.html'
            ]
        };

        const allowedPaths = roleAccess[role] || [];
        const hasAccess = allowedPaths.some(allowedPath => path.includes(allowedPath));

        if (!hasAccess) {
            this.redirectToDashboard(role);
            return false;
        }

        return true;
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = '/frontend/index.html';
        }
    }

    redirectToDashboard(role) {
        const dashboards = {
            'HOD': '/frontend/dashboard/hod-dashboard.html',
            'TEACHER': '/frontend/dashboard/teacher-dashboard.html',
            'STUDENT': '/frontend/dashboard/student-dashboard.html'
        };

        const dashboard = dashboards[role];
        if (dashboard && !window.location.pathname.includes(dashboard)) {
            window.location.href = dashboard;
        }
    }

    // Public methods
    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.redirectToLogin();
    }
}

// Global instance
window.pageGuard = new PageGuard();

// Helper functions
window.isAuthenticated = () => pageGuard.isAuthenticated();
window.hasRole = (role) => pageGuard.hasRole(role);
window.getUserRole = () => pageGuard.getUserRole();
window.requireAuth = () => pageGuard.checkAuth();
window.logout = () => pageGuard.logout();