// ===== AUTH UTILITIES - MINIMAL =====

function isAuthenticated() {
    console.log('🔍 AUTH: isAuthenticated() called');
    const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
    console.log('🔍 AUTH: Found user string:', userStr);
    const result = !!userStr;
    console.log('🔍 AUTH: isAuthenticated result:', result);
    return result;
}

function hasRole(role) {
    console.log('🔍 AUTH: hasRole() called with role:', role);
    const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
    console.log('🔍 AUTH: hasRole found user string:', userStr);
    if (!userStr) {
        console.log('🔍 AUTH: hasRole - no user string found, returning false');
        return false;
    }
    try {
        const user = JSON.parse(userStr);
        console.log('🔍 AUTH: hasRole parsed user:', user);
        const result = user && user.role === role;
        console.log('🔍 AUTH: hasRole result:', result);
        return result;
    } catch (error) {
        console.log('🔍 AUTH: hasRole - JSON parse error:', error);
        return false;
    }
}

function getCurrentUser() {
    console.log('🔍 AUTH: getCurrentUser() called');
    const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
    console.log('🔍 AUTH: getCurrentUser found user string:', userStr);
    if (!userStr) {
        console.log('🔍 AUTH: getCurrentUser - no user string found, returning null');
        return null;
    }
    try {
        const user = JSON.parse(userStr);
        console.log('🔍 AUTH: getCurrentUser parsed user:', user);
        return user;
    } catch (error) {
        console.log('🔍 AUTH: getCurrentUser - JSON parse error:', error);
        return null;
    }
}

function getUserId() {
    const user = getCurrentUser();
    return user ? (user.userId || user.id) : null;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '../index.html';
    }
}

// Export to window
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.getCurrentUser = getCurrentUser;
window.getUserId = getUserId;
window.logout = logout;
