// ===== UNIFIED SIDEBAR SYSTEM =====
// SINGLE SIDEBAR SYSTEM FOR ALL ROLES

// Sidebar state
let sidebarState = {
    isOpen: true,
    isMobile: false
};

// Load sidebar HTML
async function loadSidebar() {
    console.log('Loading unified sidebar...');
    
    try {
        const response = await fetch('../components/sidebar.html');
        if (!response.ok) {
            throw new Error(`Failed to load sidebar: ${response.status}`);
        }
        const html = await response.text();
        
        const container = document.getElementById('sidebarContainer');
        if (container) {
            container.innerHTML = html;
            console.log('Sidebar HTML loaded successfully');
            
            // Initialize sidebar functionality
            setTimeout(() => {
                initSidebar();
            }, 100); // Small delay to ensure DOM is ready
        } else {
            console.error('Sidebar container not found');
        }
    } catch (error) {
        console.error('Failed to load sidebar:', error);
    }
}

// Initialize sidebar functionality
function initSidebar() {
    console.log('Initializing unified sidebar...');
    
    // Update user info
    updateUserInfo();
    
    // Show correct menu for user role
    updateSidebarForUserRole();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup navigation
    setupNavigation();
    
    // Setup logout
    setupLogout();
    
    // Set active state based on current URL
    setActiveFromURL();
    
    console.log('Sidebar initialized successfully');
}

// Update user information in sidebar
function updateUserInfo() {
    const user = window.auth?.getCurrentUser();
    if (!user) {
        console.log('No user found for sidebar update');
        return;
    }
    
    console.log('Updating sidebar for user:', user);
    
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl) userNameEl.textContent = user.name || 'User';
    if (userRoleEl) userRoleEl.textContent = user.role || 'User';
}

// Show/hide menus based on user role
function updateSidebarForUserRole() {
    const user = window.auth?.getCurrentUser();
    if (!user) return;
    
    console.log('Showing menu for role:', user.role);
    
    // Hide all role menus first
    document.querySelectorAll('.role-menu').forEach(menu => {
        menu.classList.remove('active');
    });
    
    // Show menu for user's role
    const roleMenuId = user.role.toLowerCase() + 'Menu';
    const roleMenu = document.getElementById(roleMenuId);
    
    if (roleMenu) {
        roleMenu.classList.add('active');
        console.log('Showing menu:', roleMenuId);
    } else {
        console.warn('Menu not found for role:', roleMenuId);
    }
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!toggle || !sidebar) return;
    
    // Check if mobile
    function checkMobile() {
        sidebarState.isMobile = window.innerWidth <= 1024;
        if (!sidebarState.isMobile) {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
        }
    }
    
    // Toggle sidebar
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        sidebarState.isOpen = !sidebarState.isOpen;
        
        if (sidebarState.isMobile) {
            sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
        }
        
        // Update icon
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = sidebarState.isOpen ? 'fas fa-times' : 'fas fa-bars';
        }
    });
    
    // Close sidebar when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            sidebarState.isOpen = false;
            
            const icon = toggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        });
    }
    
    // Check on resize
    window.addEventListener('resize', checkMobile);
    checkMobile();
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigate(page);
        });
    });
}

// Navigate to page
function navigate(page) {
    console.log('Navigating to page:', page);
    
    const user = window.auth?.getCurrentUser();
    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = '../index.html';
        return;
    }
    
    // Route mapping for demo
    const routes = {
        dashboard: `dashboard/${user.role.toLowerCase()}-dashboard.html`,
        'manage-classes': 'pages/manage-classes.html',
        'manage-divisions': 'pages/manage-divisions.html',
        'manage-teachers': 'pages/manage-teachers.html',
        'manage-students': 'pages/manage-students.html',
        'activity-log': 'pages/activity-log.html',
        notifications: 'pages/notifications.html',
        attendance: 'pages/attendance.html',
        notes: 'pages/notes.html',
        quiz: 'pages/quiz.html',
        results: 'pages/results.html'
    };
    
    const route = routes[page];
    if (route) {
        console.log('Navigating to:', route);
        window.location.href = route;
    } else {
        console.error('Route not found for page:', page);
    }
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.auth?.logout();
        });
    }
}

// Set active state based on current URL
function setActiveFromURL() {
    const path = window.location.pathname;
    
    // Remove active from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Map paths to page keys
    const pathToPage = {
        '/dashboard/hod-dashboard.html': 'dashboard',
        '/dashboard/teacher-dashboard.html': 'dashboard',
        '/dashboard/student-dashboard.html': 'dashboard',
        '/pages/manage-classes.html': 'manage-classes',
        '/pages/manage-divisions.html': 'manage-divisions',
        '/pages/manage-teachers.html': 'manage-teachers',
        '/pages/manage-students.html': 'manage-students',
        '/pages/activity-log.html': 'activity-log',
        '/pages/notifications.html': 'notifications',
        '/pages/attendance.html': 'attendance',
        '/pages/notes.html': 'notes',
        '/pages/quiz.html': 'quiz',
        '/pages/results.html': 'results'
    };
    
    const page = pathToPage[path];
    if (page) {
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Export functions
window.loadSidebar = loadSidebar;
window.sidebar = {
    loadSidebar,
    updateUserInfo,
    updateSidebarForUserRole,
    navigate
};

console.log('Unified sidebar system loaded');
