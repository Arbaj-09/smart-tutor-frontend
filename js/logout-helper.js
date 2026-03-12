// ===== LOGOUT HELPER =====
// Centralized logout functionality to fix path issues

window.LogoutHelper = {
    // Main logout function
    logout: function(showConfirm = true) {
        const performLogout = () => {
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear any additional app-specific data
            if (window.authState) {
                window.authState.user = null;
                if (window.authState.sessionTimeout) {
                    clearTimeout(window.authState.sessionTimeout);
                }
            }
            
            // Redirect to login page (relative path)
            window.location.href = '../index.html';
        };
        
        if (showConfirm) {
            if (confirm('Are you sure you want to logout?')) {
                performLogout();
            }
        } else {
            performLogout();
        }
    },
    
    // Logout with API call
    logoutWithAPI: async function(showConfirm = true) {
        const performLogout = async () => {
            try {
                // Try to call logout API if available
                if (window.authAPI && window.authAPI.logout) {
                    await window.authAPI.logout();
                } else if (window.api && window.api.auth && window.api.auth.logout) {
                    await window.api.auth.logout();
                }
            } catch (error) {
                console.log('Logout API call failed:', error);
            } finally {
                // Clear storage and redirect regardless of API success
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear auth state
                if (window.authState) {
                    window.authState.user = null;
                    if (window.authState.sessionTimeout) {
                        clearTimeout(window.authState.sessionTimeout);
                    }
                }
                
                // Redirect to login page
                window.location.href = '../index.html';
            }
        };
        
        if (showConfirm) {
            if (confirm('Are you sure you want to logout?')) {
                performLogout();
            }
        } else {
            performLogout();
        }
    },
    
    // Setup logout button
    setupLogoutButton: function(buttonId = 'logoutBtn') {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener('click', () => {
                this.logoutWithAPI();
            });
            return true;
        }
        
        // Try to find by class if ID not found
        const fallbackBtn = document.querySelector('.logout-btn');
        if (fallbackBtn) {
            fallbackBtn.addEventListener('click', () => {
                this.logoutWithAPI();
            });
            return true;
        }
        
        // Retry after a short delay (sidebar might still be loading)
        setTimeout(() => {
            this.setupLogoutButton(buttonId);
        }, 500);
        
        return false;
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup logout button after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (!window.LogoutHelper.setupLogoutButton()) {
            console.log('Logout button not found');
        }
    }, 100);
});

// Also expose as global function for backward compatibility
window.logout = () => window.LogoutHelper.logout();
