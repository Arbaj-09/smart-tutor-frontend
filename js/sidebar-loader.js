// ===== SIDEBAR LOADER (FINAL) =====

// Expose loadSidebar globally
window.loadSidebar = loadSidebar;

async function loadSidebar() {
  const container = document.getElementById('sidebarContainer');
  if (!container) return;

  try {
    const res = await fetch('../components/sidebar.html');
    container.innerHTML = await res.text();

    const user = getCurrentUser();
    if (!user || !user.role) {
      window.location.replace('/index.html');
      return;
    }

    setupSidebar(user);
  } catch (e) {
    console.error('Sidebar load failed', e);
    // Fallback: create basic sidebar
    container.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <i class="fas fa-graduation-cap"></i>
            <span class="sidebar-title">SmartTutor</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a href="../dashboard/hod-dashboard.html" class="nav-link">
            <i class="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
          <a href="../pages/manage-classes.html" class="nav-link">
            <i class="fas fa-chalkboard"></i>
            <span>Manage Classes</span>
          </a>
          <a href="../pages/manage-teachers.html" class="nav-link">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>Manage Teachers</span>
          </a>
          <a href="../pages/manage-students.html" class="nav-link">
            <i class="fas fa-user-graduate"></i>
            <span>Manage Students</span>
          </a>
          <a href="../pages/activity-log.html" class="nav-link">
            <i class="fas fa-history"></i>
            <span>Activity Log</span>
          </a>
          <a href="../pages/notifications.html" class="nav-link">
            <i class="fas fa-bell"></i>
            <span>Notifications</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button id="logoutBtn" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    `;
    
    // Setup logout after fallback
    setTimeout(() => setupLogout(getCurrentUser()), 100);
  }
}

function setupSidebar(user) {
  // Wait a bit for DOM to be ready
  setTimeout(() => {
    setupUserInfo(user);
    setupRoleMenu(user.role);
    setupNavigation();
    setActiveFromURL();
    setupLogout();
  }, 100);
}

// ---------- USER INFO ----------
function setupUserInfo(user) {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (roleEl) roleEl.textContent = user.role || '';
  
  // Also setup user profile in footer if exists
  const profileNameEl = document.querySelector('.user-name');
  const profileRoleEl = document.querySelector('.user-role');
  
  if (profileNameEl) profileNameEl.textContent = user.name || 'User';
  if (profileRoleEl) profileRoleEl.textContent = user.role || '';
}

// ---------- ROLE MENU ----------
function setupRoleMenu(role) {
  document.querySelectorAll('.role-menu')
    .forEach(m => m.classList.remove('active'));

  const normalized = String(role).toUpperCase();
  const menuMap = {
    HOD: 'hodMenu',
    TEACHER: 'teacherMenu',
    STUDENT: 'studentMenu'
  };

  const menuId = menuMap[normalized];
  if (menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.add('active');
  }
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
  const user = getCurrentUser();
  if (!user) {
    window.location.replace('/index.html');
    return;
  }

  const base = {
    dashboard: `/dashboard/${user.role.toLowerCase()}-dashboard.html`,
    'manage-classes': '/pages/manage-classes.html',
    'manage-divisions': '/pages/manage-divisions.html',
    'manage-teachers': '/pages/manage-teachers.html',
    'manage-students': '/pages/manage-students.html',
    'activity-log': '/pages/activity-log.html',
    notifications: '/pages/notifications.html',
    attendance: '/pages/attendance.html',
    notes: '/pages/notes.html',
    quiz: '/pages/quiz.html',
    results: '/pages/results.html'
  };

  if (base[page]) {
    window.location.href = base[page];
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

// ---------- LOGOUT ----------
function setupLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) {
    // Try to find logout button in footer
    const footerBtn = document.querySelector('.logout-btn');
    if (footerBtn) {
      footerBtn.onclick = () => {
        localStorage.clear();
        window.location.replace('/index.html');
      };
    }
    return;
  }

  btn.onclick = () => {
    localStorage.clear();
    window.location.replace('/index.html');
  };
}

// ---------- USER UTIL ----------
function getCurrentUser() {
  // Use localStorage directly to avoid conflicts
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}
