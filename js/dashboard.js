// ===== DASHBOARD FUNCTIONALITY =====

let dashboardState = {
    charts: {},
    refreshInterval: null,
    notifications: [],
};

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Check authentication
        if (!isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }
        
        // Load dashboard data
        await loadDashboardData();
        
        // Setup auto-refresh
        setupAutoRefresh();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Failed to initialize dashboard', 'error');
    }
}

// Load dashboard data
async function loadDashboardData() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        showLoading();
        
        let response;
        switch (user.role) {
            case 'HOD':
                response = await hodAPI.getDashboardStats();
                break;
            case 'TEACHER':
                response = await teacherAPI.getDashboardStats();
                break;
            case 'STUDENT':
                response = await studentAPI.getDashboardStats();
                break;
            default:
                throw new Error('Invalid user role');
        }
        
        if (response) {
            updateDashboardUI(response);
        }
        
        // Load notifications
        await loadNotifications();
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        handleAuthError(error);
    } finally {
        hideLoading();
    }
}

// Update dashboard UI
function updateDashboardUI(data) {
    // Update stats cards with animation
    updateStatsCards(data);
    
    // Update charts if they exist
    updateCharts(data);
    
    // Update recent activities if they exist
    if (document.getElementById('recentActivities')) {
        loadRecentActivities();
    }
}

// Update stats cards
function updateStatsCards(data) {
    const statMappings = {
        totalClasses: 'totalClasses',
        totalTeachers: 'totalTeachers', 
        totalStudents: 'totalStudents',
        overallAttendancePercentage: 'attendanceRate',
        todayAttendance: 'todayAttendance',
        averageQuizScore: 'averageQuizScore',
        totalQuizzes: 'totalQuizzes',
        totalNotes: 'totalNotes',
        unreadNotifications: 'unreadNotifications'
    };
    
    Object.entries(statMappings).forEach(([dataKey, elementId]) => {
        const element = document.getElementById(elementId);
        const value = data[dataKey];
        
        if (element && value !== undefined) {
            if (elementId.includes('Rate') || elementId.includes('Score')) {
                // Percentage values
                animateNumber(elementId, parseFloat(value).toFixed(1), '%');
            } else {
                // Count values
                animateNumber(elementId, parseInt(value) || 0);
            }
        }
    });
}

// Animate number counting
function animateNumber(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        if (typeof targetValue === 'number' && targetValue % 1 !== 0) {
            element.textContent = currentValue.toFixed(1) + suffix;
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString() + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Update charts
function updateCharts(data) {
    // Update class distribution chart
    const classChart = dashboardState.charts.classDistribution;
    if (classChart && data.classDistribution) {
        classChart.data.datasets[0].data = data.classDistribution;
        classChart.update();
    }
    
    // Update attendance chart
    const attendanceChart = dashboardState.charts.attendance;
    if (attendanceChart && data.attendanceData) {
        attendanceChart.data.datasets[0].data = data.attendanceData;
        attendanceChart.update();
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const user = getCurrentUser();
        let response;
        
        switch (user.role) {
            case 'HOD':
                response = await hodAPI.getActivityLogs({ limit: 5 });
                break;
            default:
                // For other roles, activities might be loaded differently
                return;
        }
        
        if (response && response.length > 0) {
            displayRecentActivities(response);
        }
        
    } catch (error) {
        console.error('Recent activities error:', error);
    }
}

// Display recent activities
function displayRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="no-activities">
                <i class="fas fa-history"></i>
                <p>No recent activities</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.action)}"></i>
            </div>
            <div class="activity-content">
                <h4>${formatActivityTitle(activity.action)}</h4>
                <p>${activity.description}</p>
                <small class="activity-time">${formatDateTime(activity.createdAt)}</small>
            </div>
        </div>
    `).join('');
}

// Get activity icon
function getActivityIcon(action) {
    const iconMap = {
        'CREATE_CLASS': 'fa-chalkboard',
        'CREATE_DIVISION': 'fa-object-group',
        'CREATE_TEACHER': 'fa-user-plus',
        'UPDATE_TEACHER': 'fa-user-edit',
        'DELETE_TEACHER': 'fa-user-minus',
        'CREATE_STUDENT': 'fa-user-graduate',
        'UPDATE_STUDENT': 'fa-user-edit',
        'DELETE_STUDENT': 'fa-user-times',
        'MARK_ATTENDANCE': 'fa-calendar-check',
        'UPLOAD_NOTES': 'fa-file-upload',
        'CREATE_QUIZ': 'fa-question-circle',
        'ATTEMPT_QUIZ': 'fa-tasks',
        'LOGIN': 'fa-sign-in-alt',
        'LOGOUT': 'fa-sign-out-alt'
    };
    
    return iconMap[action] || 'fa-circle';
}

// Format activity title
function formatActivityTitle(action) {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await commonAPI.getNotifications({ unread: true, limit: 5 });
        
        if (response) {
            dashboardState.notifications = response;
            updateNotificationBadge(response.length);
        }
        
    } catch (error) {
        console.error('Notifications error:', error);
    }
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh dashboard every 5 minutes
    dashboardState.refreshInterval = setInterval(() => {
        loadDashboardData();
    }, 5 * 60 * 1000);
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R: Refresh dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            loadDashboardData();
        }
        
        // Ctrl/Cmd + N: Notifications
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            navigateToPage('notifications');
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Refresh dashboard
function refreshDashboard() {
    loadDashboardData();
    showToast('Dashboard refreshed', 'success');
}

// Export dashboard data
function exportDashboardData() {
    const user = getCurrentUser();
    const data = {
        user: user,
        timestamp: new Date().toISOString(),
        // Add dashboard data here
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dashboard data exported', 'success');
}

// Print dashboard
function printDashboard() {
    window.print();
}

// Share dashboard
function shareDashboard() {
    if (navigator.share) {
        navigator.share({
            title: 'SmartTutor Dashboard',
            text: 'Check out my SmartTutor dashboard',
            url: window.location.href
        }).then(() => {
            showToast('Dashboard shared successfully', 'success');
        }).catch((error) => {
            console.error('Share error:', error);
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Dashboard link copied to clipboard', 'success');
        });
    }
}

// Initialize charts (helper function)
function initializeCharts() {
    // Class Distribution Chart
    const classCtx = document.getElementById('classDistributionChart');
    if (classCtx) {
        dashboardState.charts.classDistribution = new Chart(classCtx, {
            type: 'doughnut',
            data: {
                labels: ['FY', 'SY', 'TY'],
                datasets: [{
                    data: [30, 45, 25],
                    backgroundColor: [
                        '#4f46e5',
                        '#06b6d4',
                        '#10b981'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Attendance Chart
    const attendanceCtx = document.getElementById('attendanceChart');
    if (attendanceCtx) {
        dashboardState.charts.attendance = new Chart(attendanceCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Attendance %',
                    data: [85, 92, 78, 88, 95],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dashboardState.refreshInterval) {
        clearInterval(dashboardState.refreshInterval);
    }
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        loadDashboardData,
        refreshDashboard,
        exportDashboardData,
        printDashboard,
        shareDashboard,
    };
}
