// ===== CENTRALIZED SIDEBAR SYSTEM =====

class SidebarSystem {
    constructor() {
        // Initialize based on screen size
        // On desktop (>1024px): sidebar is always visible, so isOpen = true
        // On mobile/tablet (<=1024px): sidebar starts hidden, so isOpen = false
        this.isOpen = window.innerWidth > 1024;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Load sidebar HTML (this will trigger setupSidebarContent after HTML is loaded)
        this.loadSidebarHTML();
    }

    async loadSidebarHTML() {
        try {
            const response = await fetch('../components/sidebar.html');
            const html = await response.text();
            const container = document.getElementById('sidebarContainer');
            if (container) {
                container.innerHTML = html;
                this.setupSidebarContent();
            }
        } catch (error) {
            console.error('Failed to load sidebar:', error);
            // Fallback sidebar
            this.createFallbackSidebar();
        }
    }

    createFallbackSidebar() {
        const container = document.getElementById('sidebarContainer');
        if (!container) return;

        const fallbackHTML = `
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="logo">
                        <i class="fas fa-graduation-cap"></i>
                        <span class="logo-text">SmartTutor</span>
                    </div>
                    <button class="sidebar-toggle" id="sidebarToggle">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                
                <div class="sidebar-content">
                    <div class="user-profile">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name" id="userName">Loading...</div>
                            <div class="user-role" id="userRole">Loading...</div>
                        </div>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <ul class="nav-list" id="navList">
                            <!-- Menu items will be loaded based on role -->
                        </ul>
                    </nav>
                </div>
                
                <div class="sidebar-footer">
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        `;
        
        container.innerHTML = fallbackHTML;
        this.setupSidebarContent();
    }

    setupSidebarContent() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.loadCurrentUser();
            this.setupEventListeners();
            this.activateRoleMenu();
        }, 100);
    }

    loadCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        this.currentUser = userStr ? JSON.parse(userStr) : null;
        if (this.currentUser) {
            this.updateUserInfo();
            this.updateRoleMenu();
            this.setActiveMenuItem();
        } else {
            window.location.href = '../index.html';
        }
    }

    updateUserInfo() {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) {
            userNameEl.textContent = this.currentUser?.name || 'User';
        }
        
        if (userRoleEl) {
            userRoleEl.textContent = this.currentUser?.role || 'User';
        }
    }

    activateRoleMenu() {
        if (!this.currentUser) return;

        // Hide all role menus first
        document.querySelectorAll('.role-menu').forEach(menu => {
            menu.classList.remove('active');
        });

        // Activate based on role from currentUser object
        const role = this.currentUser.role;
        if (role === 'HOD') {
            const hodMenu = document.getElementById('hodMenu');
            if (hodMenu) hodMenu.classList.add('active');
        } else if (role === 'TEACHER') {
            const teacherMenu = document.getElementById('teacherMenu');
            if (teacherMenu) teacherMenu.classList.add('active');
        } else if (role === 'STUDENT') {
            const studentMenu = document.getElementById('studentMenu');
            if (studentMenu) studentMenu.classList.add('active');
        }
    }

    updateRoleMenu() {
        const navList = document.getElementById('navList');
        if (!navList || !this.currentUser) return;

        const role = this.currentUser.role;
        let menuItems = [];

        switch (role) {
            case 'HOD':
                menuItems = [
                    { icon: 'fas fa-tachometer-alt', text: 'Dashboard', href: '../dashboard/hod-dashboard.html' },
                    { icon: 'fas fa-chalkboard', text: 'Manage Classes', href: '../pages/manage-classes.html' },
                    { icon: 'fas fa-users', text: 'Manage Teachers', href: '../pages/manage-teachers.html' },
                    { icon: 'fas fa-user-graduate', text: 'Manage Students', href: '../pages/manage-students.html' },
                    { icon: 'fas fa-object-group', text: 'Manage Divisions', href: '../pages/manage-divisions.html' },
                    { icon: 'fas fa-calendar-check', text: 'Attendance', href: '../pages/attendance.html' },
                    { icon: 'fas fa-file-alt', text: 'Notes', href: '../pages/notes.html' },
                    { icon: 'fas fa-question-circle', text: 'Quiz', href: '../pages/quiz.html' },
                    { icon: 'fas fa-chart-bar', text: 'Results', href: '../pages/results.html' },
                    { icon: 'fas fa-bell', text: 'Notifications', href: '../pages/notifications.html' },
                    { icon: 'fas fa-history', text: 'Activity Log', href: '../pages/activity-log.html' }
                ];
                break;
                
            case 'TEACHER':
                menuItems = [
                    { icon: 'fas fa-tachometer-alt', text: 'Dashboard', href: '../dashboard/teacher-dashboard.html' },
                    { icon: 'fas fa-user-graduate', text: 'My Students', href: '../pages/manage-students.html' },
                    { icon: 'fas fa-calendar-check', text: 'Attendance', href: '../pages/attendance.html' },
                    { icon: 'fas fa-file-alt', text: 'Notes', href: '../pages/notes.html' },
                    { icon: 'fas fa-question-circle', text: 'Quiz', href: '../pages/quiz.html' },
                    { icon: 'fas fa-chart-bar', text: 'Results', href: '../pages/results.html' },
                    { icon: 'fas fa-bell', text: 'Notifications', href: '../pages/notifications.html' }
                ];
                break;
                
            case 'STUDENT':
                menuItems = [
                    { icon: 'fas fa-tachometer-alt', text: 'Dashboard', href: '../dashboard/student-dashboard.html' },
                    { icon: 'fas fa-calendar-check', text: 'My Attendance', href: '../pages/attendance.html' },
                    { icon: 'fas fa-file-alt', text: 'Notes', href: '../pages/notes.html' },
                    { icon: 'fas fa-question-circle', text: 'Quiz', href: '../pages/quiz.html' },
                    { icon: 'fas fa-chart-bar', text: 'My Results', href: '../pages/results.html' },
                    { icon: 'fas fa-bell', text: 'Notifications', href: '../pages/notifications.html' }
                ];
                break;
        }

        // Render menu items
        navList.innerHTML = menuItems.map(item => `
            <li class="nav-item">
                <a href="${item.href}" class="nav-link">
                    <i class="${item.icon}"></i>
                    <span class="nav-text">${item.text}</span>
                </a>
            </li>
        `).join('');
    }

    setActiveMenuItem() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace('../', ''))) {
                link.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Sidebar toggle
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggle());
        }

        // Overlay click to close sidebar
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const toggleBtn = document.getElementById('sidebarToggle');
                if (sidebar && !sidebar.contains(e.target) && !toggleBtn.contains(e.target) && this.isOpen) {
                    this.close();
                }
            }
        });

        // Handle window resize - only close sidebar on small screens
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && this.isOpen) {
                // Keep sidebar state as is on mobile
            } else if (window.innerWidth > 768) {
                // On desktop, ensure sidebar is visible (CSS will handle this)
                this.isOpen = true;
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.add('active');
        }
        
        if (overlay) {
            overlay.classList.add('active');
        }
        
        this.isOpen = true;
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        this.isOpen = false;
    }

    async handleLogout() {
        const confirmed = confirm('Are you sure you want to logout?');

        if (confirmed) {
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        }
    }

    // Public methods
    refresh() {
        this.loadCurrentUser();
    }
}

// Global instance
window.sidebarSystem = new SidebarSystem();

// Helper functions
window.loadSidebar = () => sidebarSystem.refresh();
window.toggleSidebar = () => sidebarSystem.toggle();
