// ===== SIDEBAR FUNCTIONALITY =====

let sidebarState = {
    isCollapsed: false,
    isMobile: false,
    currentUser: null,
    currentRole: null,
};

// Get current user from localStorage
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Utility functions (fallbacks if not globally available)
function showLoading() {
    if (typeof window.showLoading === 'function') {
        window.showLoading();
    } else {
        console.log('Loading...');
    }
}

function hideLoading() {
    if (typeof window.hideLoading === 'function') {
        window.hideLoading();
    }
}

function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize sidebar
async function initializeSidebar() {
    try {
        // Get current user
        const user = getCurrentUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
    
        sidebarState.userRole = user.role;
        
        // Load sidebar HTML
        await loadSidebarHTML();
        
        // Setup event listeners
        setupSidebarEvents();
        
        // Show role-based menu
        showRoleBasedMenu();
        
        // Update user info
        updateUserInfo(user);
        
        // Set active navigation
        setActiveNavigation();
        
        // Load notification count
        loadNotificationCount();
    } catch (error) {
        console.error('Failed to initialize sidebar:', error);
    }
}

// Load sidebar HTML
async function loadSidebarHTML() {
    try {
        const response = await fetch('../components/sidebar.html');
        const sidebarHTML = await response.text();
        document.getElementById('sidebarContainer').innerHTML = sidebarHTML;
    } catch (error) {
        console.error('Failed to load sidebar:', error);
    }
}

// Setup sidebar event listeners
function setupSidebarEvents() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // Mobile overlay
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Window resize
    window.addEventListener('resize', handleResize);
}

// Show role-based menu
function showRoleBasedMenu() {
    // Hide all role menus first
    const hodMenu = document.getElementById('hodMenu');
    const teacherMenu = document.getElementById('teacherMenu');
    const studentMenu = document.getElementById('studentMenu');
    
    if (hodMenu) hodMenu.style.display = 'none';
    if (teacherMenu) teacherMenu.style.display = 'none';
    if (studentMenu) studentMenu.style.display = 'none';
    
    // Show menu based on role
    switch (sidebarState.userRole) {
        case 'HOD':
            if (hodMenu) hodMenu.style.display = 'block';
            updateDashboardLink('../dashboard/hod-dashboard.html');
            break;
        case 'TEACHER':
            if (teacherMenu) teacherMenu.style.display = 'block';
            updateDashboardLink('../dashboard/teacher-dashboard.html');
            break;
        case 'STUDENT':
            if (studentMenu) studentMenu.style.display = 'block';
            updateDashboardLink('../dashboard/student-dashboard.html');
            break;
    }
}

// Update dashboard link based on role
function updateDashboardLink(dashboardPath) {
    const dashboardLink = document.querySelector('[data-page="dashboard"]');
    if (dashboardLink) {
        dashboardLink.href = dashboardPath;
    }
}

// Toggle sidebar collapse
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    sidebarState.isCollapsed = !sidebarState.isCollapsed;
    
    if (sidebarState.isCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !overlay) return;
    
    sidebarState.isMobileMenuOpen = !sidebarState.isMobileMenuOpen;
    
    if (sidebarState.isMobileMenuOpen) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }
}

// Close mobile menu
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        sidebarState.isMobileMenuOpen = false;
    }
}

// Handle navigation
function handleNavigation(event) {
    event.preventDefault();
    
    const link = event.currentTarget;
    const page = link.dataset.page;
    
    if (!page) return;
    
    // Update active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    // Navigate to page
    navigateToPage(page);
}

// Navigate to specific page
function navigateToPage(page) {
    const pageMap = {
        'dashboard': '../dashboard/hod-dashboard.html',
        'manage-classes': '../pages/manage-classes.html',
        'manage-divisions': '../pages/manage-divisions.html',
        'manage-teachers': '../pages/manage-teachers.html',
        'manage-students': '../pages/manage-students.html',
        'attendance': '../pages/attendance.html',
        'notes': '../pages/notes.html',
        'quiz': '../pages/quiz.html',
        'results': '../pages/results.html',
        'activity-log': '../pages/activity-log.html',
        'notifications': '../pages/notifications.html'
    };
    
    // Role-based page mapping
    if (sidebarState.userRole === 'TEACHER') {
        pageMap['dashboard'] = '../dashboard/teacher-dashboard.html';
    } else if (sidebarState.userRole === 'STUDENT') {
        pageMap['dashboard'] = '../dashboard/student-dashboard.html';
    }
    
    const targetPage = pageMap[page];
    if (targetPage) {
        window.location.href = targetPage;
    }
}

// Set active navigation based on current page
function setActiveNavigation() {
    const currentPath = window.location.pathname;
    let currentPage = 'dashboard';
    
    // Determine current page from path
    if (currentPath.includes('manage-classes')) currentPage = 'manage-classes';
    else if (currentPath.includes('manage-divisions')) currentPage = 'manage-divisions';
    else if (currentPath.includes('manage-teachers')) currentPage = 'manage-teachers';
    else if (currentPath.includes('manage-students')) currentPage = 'manage-students';
    else if (currentPath.includes('attendance')) currentPage = 'attendance';
    else if (currentPath.includes('notes')) currentPage = 'notes';
    else if (currentPath.includes('quiz')) currentPage = 'quiz';
    else if (currentPath.includes('results')) currentPage = 'results';
    else if (currentPath.includes('activity-log')) currentPage = 'activity-log';
    else if (currentPath.includes('notifications')) currentPage = 'notifications';
    
    sidebarState.currentPage = currentPage;
    
    // Update active link
    const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
    if (activeLink) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');
    }
}

// Update user info in sidebar
function updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (userName) userName.textContent = user.name || 'Unknown User';
    if (userRole) userRole.textContent = user.role || 'Unknown Role';
}

// Handle logout
async function handleLogout() {
    try {
        showLoading();
        
        // Try to call logout API if available
        if (typeof window.authAPI !== 'undefined' && window.authAPI.logout) {
            await window.authAPI.logout();
        } else if (typeof window.api !== 'undefined' && window.api.auth && window.api.auth.logout) {
            await window.api.auth.logout();
        }
        
        sessionStorage.removeItem('user');
        localStorage.clear();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    } finally {
        hideLoading();
    }
}

// Handle window resize
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.add('mobile');
        sidebar.classList.remove('collapsed');
        closeMobileMenu();
    } else {
        sidebar.classList.remove('mobile');
        sidebar.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay').classList.remove('active');
        sidebarState.isMobileMenuOpen = false;
    }
}

// Load notification count
async function loadNotificationCount() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // For now, set placeholder count
        const count = 0;
        updateNotificationBadge(count);
    } catch (error) {
        console.error('Failed to load notification count:', error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Set active navigation item
function setActiveNavigation(page) {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// Public methods
window.initializeSidebar = initializeSidebar;
window.toggleSidebar = toggleSidebar;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.updateNotificationBadge = updateNotificationBadge;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeSidebar === 'function') {
        initializeSidebar();
    }
});
