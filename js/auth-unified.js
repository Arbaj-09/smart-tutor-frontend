// ===== UNIFIED AUTHENTICATION SYSTEM =====
// SINGLE SOURCE OF TRUTH FOR ALL AUTHENTICATION

// Store authentication state
let authState = {
    user: null,
    isAuthenticated: false
};

// Initialize authentication on load
function initAuth() {
    console.log('Initializing unified auth system...');
    const userStr = localStorage.getItem('user');
    console.log('Found user data in localStorage:', userStr);
    
    if (userStr) {
        try {
            authState.user = JSON.parse(userStr);
            authState.isAuthenticated = true;
            console.log('Auth initialized successfully for user:', authState.user);
        } catch (error) {
            console.error('Failed to parse user data:', error);
            clearAuth();
        }
    } else {
        console.log('No user data found in localStorage');
    }
}

// Get current user
function getCurrentUser() {
    return authState.user;
}

// Check if authenticated
function isAuthenticated() {
    return authState.isAuthenticated && authState.user !== null;
}

// Check if user has specific role
function hasRole(role) {
    if (!isAuthenticated()) return false;
    return authState.user && authState.user.role === role;
}

// Get user ID
function getUserId() {
    if (!isAuthenticated()) return null;
    return authState.user ? (authState.user.userId || authState.user.id) : null;
}

// Logout function
function logout(showConfirm = true) {
    console.log('🚨 LOGOUT CALLED! showConfirm:', showConfirm);
    console.log('🚨 Call stack:', new Error().stack);
    
    const performLogout = () => {
        console.log('🚨 PERFORMING LOGOUT...');
        
        // Clear auth state
        authState.user = null;
        authState.isAuthenticated = false;
        
        // Clear storage
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        console.log('🚨 Redirecting to login...');
        // Redirect to login
        window.location.href = '../index.html';
    };
    
    if (showConfirm) {
        console.log('🚨 Showing confirm dialog...');
        if (confirm('Are you sure you want to logout?')) {
            performLogout();
        } else {
            console.log('🚨 Logout cancelled by user');
        }
    } else {
        performLogout();
    }
}

// Clear authentication (for internal use)
function clearAuth() {
    authState.user = null;
    authState.isAuthenticated = false;
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
}

// Protect page - redirect to login if not authenticated
function protectPage(requiredRoles = []) {
    console.log('🛡️ PROTECT PAGE CALLED! required roles:', requiredRoles);
    console.log('🛡️ Current auth state:', authState);
    
    if (!isAuthenticated()) {
        console.log('🚨 User not authenticated, redirecting to login');
        console.log('🚨 Call stack:', new Error().stack);
        window.location.href = '../index.html';
        return false;
    }
    
    if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole(role));
        console.log('🛡️ User has required role?', hasRequiredRole, 'for roles:', requiredRoles);
        if (!hasRequiredRole) {
            console.log('🚨 User does not have required role, redirecting to login');
            console.log('🚨 Call stack:', new Error().stack);
            window.location.href = '../index.html';
            return false;
        }
    }
    
    console.log('✅ User authenticated and has required role');
    return true;
}

// Initialize on load
initAuth();

// Export to window
window.auth = {
    getCurrentUser,
    isAuthenticated,
    hasRole,
    getUserId,
    logout,
    protectPage,
    initAuth
};

// Also export individual functions for compatibility
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.getUserId = getUserId;
window.logout = logout;

console.log('Unified auth system loaded');
