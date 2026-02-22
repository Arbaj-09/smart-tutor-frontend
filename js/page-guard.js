// ===== SIMPLE PAGE GUARD - NO SECURITY =====

// Simple HOD page guard
function requireHod() {
    const user = getCurrentUser();
    if (!user || !user.role || user.role !== 'HOD') {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Simple Teacher page guard
function requireTeacher() {
    const user = getCurrentUser();
    if (!user || !user.role || user.role !== 'TEACHER') {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Simple Student page guard
function requireStudent() {
    const user = getCurrentUser();
    if (!user || !user.role || user.role !== 'STUDENT') {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Generic role guard
function requireRole(requiredRole) {
    const user = getCurrentUser();
    if (!user || !user.role || user.role !== requiredRole) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Simple authentication guard (any logged in user)
function requireAuth() {
    const user = getCurrentUser();
    if (!user || !user.role) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Export for use in other modules
window.requireHod = requireHod;
window.requireTeacher = requireTeacher;
window.requireStudent = requireStudent;
window.requireRole = requireRole;
window.requireAuth = requireAuth;
