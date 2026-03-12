// ===== SIDEBAR LOADER (FINAL) =====

// Expose loadSidebar globally
window.loadSidebar = loadSidebar;

// ---------- MOBILE MENU ----------
function setupMobileMenu() {
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebarContainer');
  
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle mobile menu
      sidebar.classList.toggle('mobile-open');
      document.body.classList.toggle('sidebar-open');
      
      // Update button icon
      const icon = mobileToggle.querySelector('i') || mobileToggle;
      if (sidebar.classList.contains('mobile-open')) {
        icon.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        icon.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && 
          !sidebar.contains(e.target) && 
          !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
        document.body.classList.remove('sidebar-open');
        const icon = mobileToggle.querySelector('i') || mobileToggle;
        icon.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  }
}

// ---------- LOAD GLOBAL NOTIFICATION BELL ----------
function loadGlobalNotificationBell() {
  // Check if notification bell already exists
  if (document.getElementById('globalNotificationBell')) {
    initializeNotificationBell();
    return;
  }

  // Load notification bell HTML
  fetch('../components/notification-bell.html')
    .then(response => response.text())
    .then(html => {
      // Add to body
      document.body.insertAdjacentHTML('beforeend', html);
      initializeNotificationBell();
    })
    .catch(error => console.error('Error loading notification bell:', error));
}

// ---------- SIDEBAR LOADING ----------
function loadSidebar() {
  const sidebarContainer = document.getElementById('sidebarContainer');
  if (!sidebarContainer) {
    console.error('Sidebar container not found');
    return;
  }

  // Load sidebar HTML
  fetch('../components/sidebar.html')
    .then(response => response.text())
    .then(html => {
      sidebarContainer.innerHTML = html;
      setupLogoutButton();
      setupMobileMenu();
      setupNavigation();
      updateSidebarForUserRole();
      loadGlobalNotificationBell(); // Load global notification bell
      
      // Check if additional setup function exists
      if (typeof setupSidebar === 'function') {
        setupSidebar();
      }
    })
    .catch(error => console.error('Error loading sidebar:', error));
}

// ---------- MOBILE MENU ----------
function setupMobileMenu() {
  console.log('🔍 MOBILE: Setting up mobile menu toggle...');
  
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebarContainer');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 MOBILE: Hamburger menu clicked!');
      
      // Toggle sidebar visibility
      if (sidebar.classList.contains('active')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
    console.log('✅ MOBILE: Mobile menu toggle setup completed');
  } else {
    console.log('❌ MOBILE: Mobile toggle or sidebar not found');
  }
  
  // Setup overlay click to close menu
  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }
}

function openMobileMenu() {
  console.log('🔍 MOBILE: Opening mobile menu...');
  const sidebar = document.getElementById('sidebarContainer');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (sidebar) sidebar.classList.add('active');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeMobileMenu() {
  console.log('🔍 MOBILE: Closing mobile menu...');
  const sidebar = document.getElementById('sidebarContainer');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = ''; // Restore background scroll
}

// ---------- LOGOUT ----------
function setupLogoutButton() {
  console.log('🔍 LOGOUT: Setting up logout button...');
  
  // Simple direct approach - find and setup logout button
  function setupLogout(element) {
    if (!element) return;
    
    // Remove existing listeners to prevent duplicates
    element.replaceWith(element.cloneNode(true));
    const newElement = document.getElementById('logoutBtn') || document.querySelector('.logout-btn');
    
    if (newElement) {
      newElement.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔍 LOGOUT: Logout button clicked!');
        performLogout();
      });
      console.log('✅ LOGOUT: Logout button event listener attached');
    }
  }
  
  // Try to find logout button
  const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout-btn');
  setupLogout(logoutBtn);
  
  // If not found, wait a bit and try again (sidebar might be loading)
  if (!logoutBtn) {
    setTimeout(() => {
      const delayedBtn = document.getElementById('logoutBtn') || document.querySelector('.logout-btn');
      setupLogout(delayedBtn);
    }, 1000);
  }
}

function performLogout() {
  console.log('🔍 LOGOUT: Performing logout...');
  console.log('🔍 LOGOUT: Current localStorage before clear:', localStorage.getItem('user'));
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('🔍 LOGOUT: Storage cleared, redirecting to login');
  console.log('🔍 LOGOUT: localStorage after clear:', localStorage.getItem('user'));
  
  // Force redirect to login page
  window.location.replace('../index.html');
}

// ---------- NAVIGATION ----------
function setupNavigation() {
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.page);
    });
  });
}

function navigate(page) {
  console.log('🔍 NAVIGATION: Navigate to page:', page);
  
  // Manual user check (same as other pages)
  const userStr = localStorage.getItem('user');
  console.log('🔍 NAVIGATION: Manual user check - userStr:', userStr);
  
  if (!userStr) {
    console.log('🔍 NAVIGATION: No user found, redirecting to login');
    window.location.replace('../index.html');
    return;
  }
  
  let user;
  try {
    user = JSON.parse(userStr);
    console.log('🔍 NAVIGATION: Parsed user:', user);
  } catch (error) {
    console.log('🔍 NAVIGATION: Failed to parse user, redirecting:', error);
    window.location.replace('../index.html');
    return;
  }
  
  // Get the correct base path depending on current location
  const currentPath = window.location.pathname;
  console.log('🔍 NAVIGATION: Current path:', currentPath);
  
  const isInPages = currentPath.includes('/pages/');
  const isInDashboard = currentPath.includes('/dashboard/');
  const basePath = (isInPages || isInDashboard) ? '../' : './';
  
  console.log('🔍 NAVIGATION: Is in pages:', isInPages, 'Is in dashboard:', isInDashboard, 'Base path:', basePath);

  // Fixed mapping with absolute paths as fallback
  const routes = {
    dashboard: `${basePath}dashboard/${user.role.toLowerCase()}-dashboard.html`,
    'manage-classes': `${basePath}pages/manage-classes.html`,
    'manage-divisions': `${basePath}pages/manage-divisions.html`,
    'manage-teachers': `${basePath}pages/manage-teachers.html`,
    'manage-students': `${basePath}pages/manage-students.html`,
    'activity-log': `${basePath}pages/activity-log.html`,
    notifications: `${basePath}pages/notifications.html`,
    attendance: `${basePath}pages/attendance.html`,
    notes: `${basePath}pages/notes.html`,
    quiz: `${basePath}pages/quiz.html`,
    results: `${basePath}pages/results.html`
  };

  const url = routes[page];
  if (url) {
    console.log('🔍 NAVIGATION: Navigating to:', url);
    window.location.href = url;
  } else {
    console.log('🔍 NAVIGATION: Page not found:', page);
    // Fallback to direct navigation
    const fallbackPaths = {
      'manage-students': '../pages/manage-students.html',
      'manage-classes': '../pages/manage-classes.html',
      'manage-divisions': '../pages/manage-divisions.html',
      'manage-teachers': '../pages/manage-teachers.html',
      'activity-log': '../pages/activity-log.html',
      'notifications': '../pages/notifications.html',
      'notes': '../pages/notes.html',
      'attendance': '../pages/attendance.html',
      'quiz': '../pages/quiz.html',
      'results': '../pages/results.html'
    };
    
    const fallbackUrl = fallbackPaths[page];
    if (fallbackUrl) {
      console.log('Using fallback navigation to:', fallbackUrl);
      window.location.href = fallbackUrl;
    } else {
      console.error('No navigation path found for:', page);
    }
  }
}

// ---------- ACTIVE STATE ----------
function setActiveFromURL() {
  const path = window.location.pathname;

  document.querySelectorAll('.nav-link')
    .forEach(l => l.classList.remove('active'));

  // Map exact paths to page keys
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
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');
  }
}

// ---------- USER ROLE ----------
function updateSidebarForUserRole() {
  // Manual user check (same as other pages)
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  
  let user;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    console.log('Failed to parse user in sidebar:', error);
    return;
  }
  
  if (!user || !user.role) return;

  const role = String(user.role).toUpperCase();
  
  // Hide all role-specific menus
  document.querySelectorAll('.role-menu').forEach(menu => {
    menu.classList.remove('active');
  });

  // Show relevant menu
  const menuMap = {
    'TEACHER': 'teacherMenu',
    'STUDENT': 'studentMenu',
    'HOD': 'hodMenu'
  };

  const menuId = menuMap[role];
  if (menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
      menu.classList.add('active');
      console.log('Showing menu:', menuId, 'for role:', role);
    }
  }

  // Update user info - using correct IDs from sidebar.html
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  
  if (userName) userName.textContent = user.name || 'User';
  if (userRole) userRole.textContent = role || 'User';
  
  // Load notification count
  loadUnreadNotificationCount();
  
  console.log('Updated sidebar for user:', user.name, 'Role:', role);
}

// Load unread notification count
async function loadUnreadNotificationCount() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId || !user.role) return;
    
    const response = await fetch(
      `http://localhost:8082/api/notifications/unread/count/role/${user.role}/user/${user.userId}`
    );
    
    if (response.ok) {
      const count = await response.json();
      const badge = document.getElementById("notificationBadge");
      
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : count;
          badge.style.display = "inline-flex";
          badge.classList.add("show");
        } else {
          badge.style.display = "none";
          badge.classList.remove("show");
        }
        console.log(`🔔 Updated notification count: ${count}`);
      }
    }
  } catch (error) {
    console.error('❌ Error loading notification count:', error);
  }
}

// Make function globally available
window.loadUnreadNotificationCount = loadUnreadNotificationCount;

// Update notification count every 10 seconds
setInterval(loadUnreadNotificationCount, 10000);

// Initialize notification bell functionality
function initializeNotificationBell() {
  const notificationBell = document.getElementById('notificationBell');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  
  if (!notificationBell || !notificationDropdown) {
    console.log('Notification bell elements not found, retrying...');
    setTimeout(initializeNotificationBell, 500);
    return;
  }
  
  // Remove existing event listeners to prevent duplicates
  notificationBell.replaceWith(notificationBell.cloneNode(true));
  const newBell = document.getElementById('notificationBell');
  
  // Toggle dropdown
  newBell.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
    
    // Load notifications when dropdown opens
    if (notificationDropdown.classList.contains('show')) {
      loadRecentNotifications();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!notificationDropdown.contains(e.target) && !newBell.contains(e.target)) {
      notificationDropdown.classList.remove('show');
    }
  });
  
  // Mark all as read
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }
  
  console.log('Global notification bell initialized successfully');
}

// Load recent notifications for dropdown
async function loadRecentNotifications() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId || !user.role) return;
    
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Show skeleton loading
    notificationList.innerHTML = `
      <div class="notification-skeleton">
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
      </div>
    `;
    
    const response = await fetch(
      `http://localhost:8082/api/notifications/role/${user.role}/user/${user.userId}?limit=5`
    );
    
    if (response.ok) {
      const notifications = await response.json();
      renderNotificationDropdown(notifications);
    } else {
      notificationList.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>Failed to load notifications</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error loading recent notifications:', error);
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
      notificationList.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>Failed to load notifications</p>
        </div>
      `;
    }
  }
}

// Render notifications in dropdown
function renderNotificationDropdown(notifications) {
  const notificationList = document.getElementById('notificationList');
  if (!notificationList) return;
  
  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <div class="no-notifications">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications</p>
      </div>
    `;
    return;
  }
  
  notificationList.innerHTML = notifications.map(notification => {
    const iconClass = getNotificationIconClass(notification.title);
    const timeAgo = formatTimeAgo(notification.createdAt);
    const unreadClass = !notification.isRead ? 'unread' : '';
    
    return `
      <div class="notification-item ${unreadClass}" onclick="handleNotificationClick(${notification.id})">
        <div class="notification-icon ${iconClass}">
          <i class="fas ${getIconForNotification(notification.title)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-details">
            ${notification.teacherName ? `<span class="detail-tag"><i class="fas fa-user"></i> ${notification.teacherName}</span>` : ''}
            ${notification.subject ? `<span class="detail-tag"><i class="fas fa-book"></i> ${notification.subject}</span>` : ''}
            ${notification.className ? `<span class="detail-tag"><i class="fas fa-school"></i> ${notification.className}</span>` : ''}
            ${notification.divisionName ? `<span class="detail-tag"><i class="fas fa-layer-group"></i> ${notification.divisionName}</span>` : ''}
          </div>
          <div class="notification-meta">
            <div class="notification-time">
              <i class="fas fa-clock"></i>
              ${timeAgo}
            </div>
          </div>
        </div>
        <i class="fas fa-trash notification-delete"
           onclick="event.stopPropagation(); deleteNotificationFromBell(${notification.id})"
           title="Delete notification"></i>
      </div>
    `;
  }).join('');
}

// Get notification icon class based on title
function getNotificationIconClass(title) {
  if (title.toLowerCase().includes('note')) return 'notes';
  if (title.toLowerCase().includes('quiz')) return 'quiz';
  return 'general';
}

// Get icon for notification type
function getIconForNotification(title) {
  if (title.toLowerCase().includes('note')) return 'fa-book';
  if (title.toLowerCase().includes('quiz')) return 'fa-question-circle';
  return 'fa-bell';
}

// Format time ago
function formatTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString();
}

// Handle notification click
async function handleNotificationClick(notificationId) {
  try {
    // Mark as read
    await fetch(`http://localhost:8082/api/notifications/${notificationId}/read`, {
      method: 'POST'
    });
    
    // Update UI
    loadUnreadNotificationCount();
    loadRecentNotifications();
    
    // Close dropdown
    document.getElementById('notificationDropdown').classList.remove('show');
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

// Delete notification from bell
async function deleteNotificationFromBell(notificationId) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId || !user.role) return;
    
    await fetch(`http://localhost:8082/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    
    // Update UI
    loadUnreadNotificationCount();
    loadRecentNotifications();
    
    showToast('Notification deleted', 'success');
    
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    showToast('Failed to delete notification', 'error');
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId || !user.role) return;
    
    await fetch(`http://localhost:8082/api/notifications/mark-all-read/role/${user.role}/user/${user.userId}`, {
      method: 'POST'
    });
    
    // Update UI
    loadUnreadNotificationCount();
    loadRecentNotifications();
    
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
  }
}

// Update notification count every 15 seconds
setInterval(loadUnreadNotificationCount, 15000);

// Initialize notification bell when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Load global notification bell immediately
  setTimeout(loadGlobalNotificationBell, 500);
  
  // Load initial notification count
  setTimeout(loadUnreadNotificationCount, 1000);
});

// ---------- USER UTIL ----------
function getCurrentUser() {
  // Use localStorage directly to avoid conflicts
  const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    return null;
  }
}
