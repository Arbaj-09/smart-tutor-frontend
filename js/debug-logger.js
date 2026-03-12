// Debug Console Logger - Include this script in ALL pages
(function() {
    'use strict';
    
    // Only initialize if not already done
    if (window.debugConsoleInitialized) {
        return;
    }
    
    window.debugConsoleInitialized = true;
    
    // Function to get current page name
    function getPageName() {
        const path = window.location.pathname;
        if (path.includes('login.html') || path.includes('index.html')) return 'LOGIN';
        if (path.includes('teacher-dashboard')) return 'TEACHER_DASHBOARD';
        if (path.includes('student-dashboard')) return 'STUDENT_DASHBOARD';
        if (path.includes('hod-dashboard')) return 'HOD_DASHBOARD';
        if (path.includes('debug-console')) return 'DEBUG_CONSOLE';
        return 'UNKNOWN';
    }
    
    // Function to capture and store logs
    function captureLog(type, ...args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        const logEntry = {
            timestamp: timestamp,
            type: type,
            message: message,
            url: window.location.href,
            page: getPageName()
        };
        
        // Get existing logs
        let allLogs = [];
        try {
            const stored = localStorage.getItem('debugConsoleLogs');
            if (stored) {
                allLogs = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Debug Logger: Failed to read stored logs:', e);
        }
        
        // Add new log
        allLogs.push(logEntry);
        
        // Keep only last 1000 logs
        if (allLogs.length > 1000) {
            allLogs = allLogs.slice(-1000);
        }
        
        // Store back to localStorage
        try {
            localStorage.setItem('debugConsoleLogs', JSON.stringify(allLogs));
        } catch (e) {
            // If localStorage is full, clear some old logs
            if (e.name === 'QuotaExceededError') {
                allLogs = allLogs.slice(-500);
                localStorage.setItem('debugConsoleLogs', JSON.stringify(allLogs));
            }
        }
        
        // Call original console function
        const originalConsole = window.originalConsole || console;
        switch(type) {
            case 'log':
                originalConsole.log.apply(originalConsole, args);
                break;
            case 'error':
                originalConsole.error.apply(originalConsole, args);
                break;
            case 'warn':
                originalConsole.warn.apply(originalConsole, args);
                break;
            case 'info':
                originalConsole.info.apply(originalConsole, args);
                break;
        }
    }
    
    // Store original console before overriding
    window.originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    // Override console methods
    console.log = function(...args) { captureLog('log', ...args); };
    console.error = function(...args) { captureLog('error', ...args); };
    console.warn = function(...args) { captureLog('warn', ...args); };
    console.info = function(...args) { captureLog('info', ...args); };
    
    // Log initialization
    console.log(`🔍 DEBUG LOGGER: Initialized for page ${getPageName()}`);
    console.log(`🔍 DEBUG LOGGER: Current URL: ${window.location.href}`);
    
    // Make functions globally available
    window.viewDebugLogs = function() {
        // Open debug console in new window
        const debugWindow = window.open('/frontend/debug-console.html', '_blank', 'width=1200,height=800');
        if (!debugWindow) {
            alert('Popup blocked! Please allow popups and try again.');
        }
    };
    
    window.clearDebugLogs = function() {
        if (confirm('Clear all debug logs?')) {
            localStorage.removeItem('debugConsoleLogs');
            localStorage.removeItem('currentPageLogs');
            console.log('🔍 DEBUG LOGGER: All logs cleared');
        }
    };
    
    // Add keyboard shortcut (Ctrl+Shift+D) to open debug console
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            window.viewDebugLogs();
        }
    });
    
    console.log('🔍 DEBUG LOGGER: Press Ctrl+Shift+D to open debug console');
})();
