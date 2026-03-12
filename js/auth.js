// ===== AUTHENTICATION FUNCTIONALITY =====

let authState = {
    user: null,
    sessionTimeout: null,
    inactivityTimer: null,
};

// Initialize authentication
function initializeAuth() {
    checkExistingSession();
}

// Check existing session
function checkExistingSession() {
    const user = getCurrentUser();
    if (user) {
        authState.user = user;
    }
}

function setCurrentUser(user) {
    const normalized = {
        name: user?.name,
        role: String(user?.role || '').toUpperCase(),
    };

    if (!normalized.name || !normalized.role) {
        throw new Error('Invalid user payload');
    }

    localStorage.setItem('user', JSON.stringify(normalized));
    authState.user = normalized;
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user?.name || !user?.role) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

function requireRole(role) {
    if (!requireAuth()) return false;
    return String(getUserRole() || '').toUpperCase() === String(role || '').toUpperCase();
}

// Setup session management
function setupSessionManagement() {
    // Set session timeout (30 minutes)
    authState.sessionTimeout = setTimeout(() => {
        showToast('Session expired. Please login again.', 'warning');
        logout();
    }, 30 * 60 * 1000);
    
    // Extend session on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, extendSession, true);
    });
}

// Extend session
function extendSession() {
    // Clear existing timeout
    if (authState.sessionTimeout) {
        clearTimeout(authState.sessionTimeout);
    }
    
    // Set new timeout
    authState.sessionTimeout = setTimeout(() => {
        showToast('Session expired. Please login again.', 'warning');
        logout();
    }, 30 * 60 * 1000);
    
    // Reset inactivity timer
    resetInactivityTimer();
}

// Setup inactivity detection
function setupInactivityDetection() {
    // Set inactivity timeout (15 minutes)
    resetInactivityTimer();
    
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
}

// Reset inactivity timer
function resetInactivityTimer() {
    // Clear existing timer
    if (authState.inactivityTimer) {
        clearTimeout(authState.inactivityTimer);
    }
    
    // Set new timer (15 minutes)
    authState.inactivityTimer = setTimeout(() => {
        showInactivityWarning();
    }, 15 * 60 * 1000);
}

// Show inactivity warning
function showInactivityWarning() {
    showConfirmModal(
        'You have been inactive for 15 minutes. Do you want to stay logged in?',
        () => {
            extendSession();
            showToast('Session extended', 'success');
        },
        {
            title: 'Session Warning',
            buttons: [
                { text: 'Logout', class: 'btn-outline', action: 'close' },
                { text: 'Stay Logged In', class: 'btn-primary', action: 'confirm' }
            ]
        }
    );
    
    // Set additional timeout for automatic logout
    setTimeout(() => {
        if (document.querySelector('.modal-overlay.active')) {
            closeModal(document.querySelector('.modal-overlay.active'));
            logout();
        }
    }, 2 * 60 * 1000); // 2 more minutes
}

// Setup form validation
function setupFormValidation() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Real-time validation
        const inputs = loginForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });
        
        // Form submission validation
        loginForm.addEventListener('submit', (e) => {
            if (!validateForm(loginForm)) {
                e.preventDefault();
            }
        });
    }
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Validation rules
    switch (fieldName) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'password':
            if (!value) {
                isValid = false;
                errorMessage = 'Password is required';
            } else if (value.length < 6) {
                isValid = false;
                errorMessage = 'Password must be at least 6 characters';
            }
            break;
            
        case 'role':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a role';
            }
            break;
    }
    
    // Show error if invalid
    if (!isValid) {
        field.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMessage;
        field.parentNode.appendChild(errorElement);
    }
    
    return isValid;
}

// Validate entire form
function validateForm(form) {
    const inputs = form.querySelectorAll('input, select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Login function
async function login(credentials) {
    try {
        showLoading();
        
        const response = await authAPI.login(credentials);
        
        if (response) {
            // Store user session
            sessionStorage.setItem('user', JSON.stringify(response));
            authState.user = response;
            
            // Setup session management
            setupSessionManagement();
            
            showToast('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                if (response.role === 'TEACHER') {
                    window.location.href = 'pages/dashboard/teacher-dashboard.html';
                } else if (response.role === 'HOD') {
                    window.location.href = 'pages/dashboard/hod-dashboard.html';
                } else if (response.role === 'STUDENT') {
                    window.location.href = 'pages/dashboard/student-dashboard.html';
                } else {
                    window.location.href = 'pages/dashboard/hod-dashboard.html';
                }
            }, 1000);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed', 'error');
        
        // Shake the form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.classList.add('shake');
            setTimeout(() => {
                loginForm.classList.remove('shake');
            }, 500);
        }
    } finally {
        hideLoading();
    }
}

// Logout function
async function logout() {
    try {
        showLoading();
        
        // Call logout API
        await authAPI.logout();
        
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear session regardless of API call success
        clearSession();
        hideLoading();
        
        // Redirect to login
        window.location.href = '../index.html';
    }
}

// Clear session
function clearSession() {
    localStorage.removeItem('user');
    authState.user = null;
    
    // Clear timers
    if (authState.sessionTimeout) {
        clearTimeout(authState.sessionTimeout);
    }
    if (authState.inactivityTimer) {
        clearTimeout(authState.inactivityTimer);
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Get current user
function getCurrentUser() {
    if (authState.user) return authState.user;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        authState.user = JSON.parse(userStr);
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        authState.user = null;
    }

    return authState.user;
}

// Get user role
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Check if user has specific role
function hasRole(role) {
    return String(getUserRole() || '').toUpperCase() === String(role || '').toUpperCase();
}

// Check if user has any of the specified roles
function hasAnyRole(roles) {
    const userRole = getUserRole();
    return roles.includes(userRole);
}

// Update user profile
async function updateProfile(profileData) {
    try {
        showLoading();
        
        const response = await commonAPI.updateProfile(profileData);
        
        if (response) {
            // Update stored user data
            const currentUser = getCurrentUser();
            const updatedUser = { ...currentUser, ...response };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            authState.user = updatedUser;
            
            showToast('Profile updated successfully', 'success');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
}

// Change password
async function changePassword(passwordData) {
    try {
        showLoading();
        
        await commonAPI.changePassword(passwordData);
        
        showToast('Password changed successfully', 'success');
        
        // Close modal if open
        const modal = document.querySelector('.modal-overlay.active');
        if (modal) {
            closeModal(modal);
        }
        
    } catch (error) {
        console.error('Password change error:', error);
        showToast(error.message || 'Failed to change password', 'error');
    } finally {
        hideLoading();
    }
}

// Show password change modal
function showPasswordChangeModal() {
    const formFields = [
        {
            type: 'password',
            name: 'currentPassword',
            label: 'Current Password',
            placeholder: 'Enter current password',
            required: true
        },
        {
            type: 'password',
            name: 'newPassword',
            label: 'New Password',
            placeholder: 'Enter new password',
            required: true
        },
        {
            type: 'password',
            name: 'confirmPassword',
            label: 'Confirm New Password',
            placeholder: 'Confirm new password',
            required: true
        }
    ];
    
    return showFormModal(
        'Change Password',
        formFields,
        (data) => {
            // Validate passwords match
            if (data.newPassword !== data.confirmPassword) {
                showToast('Passwords do not match', 'error');
                return false;
            }
            
            // Validate password strength
            if (data.newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return false;
            }
            
            changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
        },
        {
            size: 'small'
        }
    );
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAuth,
        login,
        logout,
        isAuthenticated,
        getCurrentUser,
        getUserRole,
        hasRole,
        hasAnyRole,
        updateProfile,
        changePassword,
        showPasswordChangeModal,
    };
}
