// Firebase Cloud Messaging (FCM) Configuration
// Replace with your actual Firebase config from Firebase Console

const firebaseConfig = {
    apiKey: "AIzaSyCgQHpbtlM03a4CiDxa-VONa4fKkL13dBU",
    authDomain: "smart-tutor-c1fa3.firebaseapp.com",
    projectId: "smart-tutor-c1fa3",
    storageBucket: "smart-tutor-c1fa3.appspot.com",
    messagingSenderId: "444953493124",
    appId: "1:444953493124:web:cf76fe5682693ef091ccd1"
};

// Global Firebase initialization function
window.initializeFirebase = function() {
    // Prevent multiple initializations
    if (window.fcmInitialized) {
        console.log(" FCM: Firebase already initialized - skipping");
        return firebase.messaging();
    }
    
    console.log(' FCM: Global Firebase initialization called...');
    
    if (typeof firebase === 'undefined') {
        console.error(' FCM: Firebase not available - check script loading');
        return null;
    }
    
    // Check if Firebase app is already initialized
    if (!firebase.apps.length) {
        console.log(' FCM: Firebase not initialized yet - initializing now...');
        firebase.initializeApp(firebaseConfig);
        console.log(' FCM: Firebase app initialized successfully');
    } else {
        console.log(' FCM: Firebase app already initialized - skipping');
    }
    
    // Initialize Firebase messaging
    const messaging = firebase.messaging();
    console.log(' FCM: Firebase messaging initialized');
    
    // Mark as initialized
    window.fcmInitialized = true;
    
    // Set up foreground message handler
    messaging.onMessage((payload) => {
        console.log("🔔 Foreground notification received:", payload);
        
        const title = payload.notification?.title || payload.data?.title || "SmartTutor";
        const body = payload.notification?.body || payload.data?.message || "You have a new notification";

        // Show browser notification for foreground
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: "/assets/bell.png",
                badge: "/assets/bell.png",
                tag: 'smart-tutor-foreground'
            });
        }

        // Update notification bell immediately
        if (typeof loadUnreadNotificationCount === 'function') {
            loadUnreadNotificationCount();
        }
        
        // Refresh notification dropdown if open
        if (typeof loadRecentNotifications === 'function') {
            loadRecentNotifications();
        }
    });
    
    return messaging;
};

// Global notification handler
function handleIncomingNotification(payload) {
    console.log("🔔 Global notification handler:", payload);
    
    // Show browser notification
    const title = payload.data?.title || payload.notification?.title || "SmartTutor";
    const body = payload.data?.message || payload.notification?.body || "You have a new notification";
    
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: "/assets/bell.png",
            tag: 'smart-tutor-notification'
        });
    }
    
    // Update notification bell counter
    if (typeof window.loadUnreadNotificationCount === 'function') {
        window.loadUnreadNotificationCount();
    }
    
    // Refresh notifications list if on notifications page
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
}

// Initialize Firebase
// Firebase scripts are loaded statically in HTML, so we just initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 FCM: DOM loaded - Firebase should be available');
    
    // Small delay to ensure Firebase is fully loaded
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log('✅ FCM: Firebase is available - initializing...');
            const messaging = window.initializeFirebase();
            if (messaging) {
                console.log('✅ FCM: Firebase app initialized successfully');
                
                // Handle background messages (service worker will handle these)
                if ('serviceWorker' in navigator) {
                    console.log('🔧 FCM: Starting explicit service worker registration...');
                    
                    // Request notification permission first
                    requestNotificationPermission(messaging);
                } else {
                    console.warn('⚠️ FCM: Service workers not supported in this browser');
                }
            }
        } else {
            console.warn(' FCM: Firebase not available - check script loading');
        }
    }, 500);
});

// Internal function to handle notification permission and token
async function handleNotificationPermissionAndToken(messaging) {
    try {
        console.log("🔔 Requesting notification permission...");
        
        if ('Notification' in window) {
            console.log('🔔 Current permission:', Notification.permission);
            
            if (Notification.permission === 'granted') {
                console.log('✅ Notification permission already granted');
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                console.log('🔔 Permission result:', permission);
                
                if (permission !== 'granted') {
                    console.log('❌ Notification permission denied');
                    return false;
                }
            } else {
                console.log('❌ Notification permission previously denied');
                return false;
            }
        } else {
            console.log('❌ This browser does not support notifications');
            return false;
        }

        console.log("✅ Notification permission granted");

        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("📋 Service worker registered successfully");

        const token = await messaging.getToken({
            vapidKey: "BK6VebR0jW90fKX3MOjADmkD7e7jAUsDdNWYK_bigPznoZPx9ml_SXdgdtlivHDXTgXP4jnc6W19jJ-TUIbKnW4",
            serviceWorkerRegistration: registration
        });

        console.log("🎯 FCM Token generated successfully!");
        console.log("📱 FCM Token:", token);

        if (token && !token.startsWith('demo-fcm-token')) {
            await saveFCMTokenToServer(token);
        }

        return true;

    } catch (error) {
        console.error("❌ FCM error:", error);
        return false;
    }
}

// Expose globally without recursion
window.requestNotificationPermission = handleNotificationPermissionAndToken;

async function saveFCMTokenToServer(token) {
    try {
        console.log('💾 FCM: Starting token save process...');
        
        // Check if token already saved to prevent duplicates
        const savedToken = localStorage.getItem("savedFcmToken");
        if (savedToken === token) {
            console.log("🔄 FCM: Token already saved - skipping duplicate save");
            return;
        }
        
        const user = getCurrentUser();
        console.log('👤 FCM: User data for token save:', user);
        console.log('👤 FCM: User ID types - userId:', typeof user?.userId, 'id:', typeof user?.id);
        
        if (!user) {
            console.error('❌ FCM: User not found - cannot save FCM token');
            return;
        }
        
        // Safe user ID extraction with detailed logging
        const userId = user.userId || user.id;
        console.log('👤 FCM: Extracted userId:', userId, 'from user.userId:', user.userId, 'or user.id:', user.id);
        
        if (!userId) {
            console.error('❌ FCM: User ID is null or undefined - cannot save FCM token');
            console.error('❌ FCM: User object keys:', Object.keys(user));
            return;
        }

        if (!token || token.trim() === "") {
            console.error('❌ FCM: Token is null or empty - cannot save');
            return;
        }

        if (token.startsWith('demo-fcm-token')) {
            console.error('❌ FCM: Demo token detected - not saving to database');
            console.error('❌ FCM: Please fix Firebase configuration to generate real tokens');
            return;
        }

        console.log('🌐 FCM: Preparing to send token to backend...');
        console.log('🌐 FCM: API Endpoint: http://localhost:8082/api/notifications/fcm/token');
        console.log('🌐 FCM: Request data:', {
            token: token.substring(0, 20) + '...',
            role: user.role,
            userId: userId,
            userName: user.name
        });

        const response = await fetch('http://localhost:8082/api/notifications/fcm/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                role: user.role,
                userId: userId,
                userName: user.name
            })
        });

        console.log('📡 FCM: Backend response status:', response.status);
        console.log('📡 FCM: Backend response ok:', response.ok);

        if (response.ok) {
            const result = await response.text();
            console.log('✅ FCM: Token saved successfully!');
            console.log('📱 FCM: Server response:', result);
            
            // Mark token as saved to prevent duplicates
            localStorage.setItem("savedFcmToken", token);
            console.log('💾 FCM: Token marked as saved to prevent duplicates');
            
            console.log('✅ FCM: User Role:', user.role, '| User Name:', user.name, '| User ID:', userId);
            console.log('✅ FCM: Token (first 20 chars):', token.substring(0, 20) + '...');
        } else {
            const errorText = await response.text();
            console.error('❌ FCM: Server returned error:', response.status, errorText);
        }

    } catch (error) {
        console.error('❌ FCM: Failed to save token to server:', error);
        console.error('❌ FCM: Network error details:', error.message);
    }
}

function showNotification(notification) {
    // Show notification in the UI
    const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-toast';
    notificationElement.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-bell"></i>
            <div class="notification-text">
                <strong>${notification.title}</strong>
                <p>${notification.body}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notificationContainer.appendChild(notificationElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notificationElement.parentElement) {
            notificationElement.remove();
        }
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification-toast {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-bottom: 10px;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-content {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            gap: 10px;
        }
        
        .notification-content i {
            color: #4f46e5;
            margin-top: 2px;
        }
        
        .notification-text {
            flex: 1;
        }
        
        .notification-text strong {
            display: block;
            margin-bottom: 4px;
            color: #1f2937;
        }
        
        .notification-text p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 2px;
        }
        
        .notification-close:hover {
            color: #6b7280;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    return container;
}

// Demo mode fallback
function initializeDemoMode() {
    console.log('FCM Demo Mode: Using fallback token');
    const demoToken = 'demo-fcm-token-' + Date.now();
    localStorage.setItem('fcmToken', demoToken);
    
    // Trigger event to notify other scripts that FCM token is available
    window.dispatchEvent(new CustomEvent('fcmTokenUpdated', { detail: { token: demoToken } }));
    
    // Simulate saving token to server
    setTimeout(() => {
        saveFCMTokenToServer(demoToken);
    }, 1000);
}

// Helper function to get current user
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        console.log('👤 FCM: Raw user data from localStorage:', userStr);
        
        if (!userStr) {
            console.warn('⚠️ FCM: No user data found in localStorage');
            return {};
        }
        
        const user = JSON.parse(userStr);
        console.log('👤 FCM: Parsed user object:', user);
        console.log('👤 FCM: User role:', user.role);
        console.log('👤 FCM: User ID:', user.userId);
        console.log('👤 FCM: User name:', user.name);
        
        return user;
    } catch (error) {
        console.error('💥 FCM: Error parsing user data from localStorage:', error);
        console.error('💥 FCM: Error details:', error.message);
        return {};
    }
}

// Initialize FCM when this script loads - ONLY AFTER LOGIN
window.addEventListener('load', () => {
    console.log('🚀 FCM: Page loaded - checking for login...');
    
    // Prevent any FCM errors from causing page reload
    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('firebase')) {
            console.error('🔥 FCM: Firebase error prevented from causing reload:', e.message);
            e.preventDefault();
            return false;
        }
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.toString().includes('firebase')) {
            console.error('🔥 FCM: Firebase promise rejection prevented:', e.reason);
            e.preventDefault();
            return false;
        }
    });
    
    const userStr = localStorage.getItem("user");
    
    if(!userStr){
        console.log("⏳ FCM: No user found - waiting for login...");
        // Listen for login events
        window.addEventListener('storage', function(e) {
            if (e.key === 'user' && e.newValue) {
                console.log("🎯 FCM: User detected - initializing Firebase...");
                setTimeout(() => {
                    if (typeof firebase !== 'undefined') {
                        initializeFirebase();
                    } else {
                        console.warn('⚠️ FCM: Firebase not available');
                    }
                }, 1000);
            }
        });
        return;
    }
    
    console.log('✅ FCM: User found - initializing Firebase...');
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            initializeFirebase();
        } else {
            console.warn('⚠️ FCM: Firebase not available - loading scripts...');
        }
    }, 1000);
});

// Debug function to check FCM status - can be called from console
window.checkFCMStatus = function() {
    console.log('🔍 FCM Status Check:');
    console.log('🔍 Firebase available:', typeof firebase !== 'undefined');
    console.log('🔍 FCM Token in localStorage:', localStorage.getItem('fcmToken'));
    console.log('🔍 User data in localStorage:', localStorage.getItem('user'));
    console.log('🔍 Current user:', getCurrentUser());
    console.log('🔍 Notification permission:', Notification.permission);
    
    if (typeof firebase !== 'undefined') {
        try {
            const messaging = firebase.messaging();
            console.log('🔍 Firebase messaging available:', true);
        } catch (e) {
            console.error('❌ Firebase messaging error:', e);
        }
    }
    
    console.log('🔍 End FCM Status Check');
};

// Function to manually request notification permission
window.manualRequestNotificationPermission = function() {
    if (typeof firebase !== 'undefined') {
        const messaging = firebase.messaging();
        return requestNotificationPermission(messaging);
    } else {
        console.error('❌ Firebase not available');
        return Promise.reject('Firebase not available');
    }
};

// Manual log preservation (DISABLED by default to prevent page reload issues)
window.enableFCMLogPreservation = function() {
    console.log('📋 Enabling FCM log preservation...');
    
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    function logToStorage(type, ...args) {
        try {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${type}: ${args.join(' ')}`;
            
            let logs = JSON.parse(localStorage.getItem('fcmLogs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 50 logs
            if (logs.length > 50) {
                logs = logs.slice(-50);
            }
            
            localStorage.setItem('fcmLogs', JSON.stringify(logs));
        } catch (e) {
            // Silently fail to avoid infinite loops
        }
    }
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        logToStorage('LOG', ...args);
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        logToStorage('ERROR', ...args);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        logToStorage('WARN', ...args);
    };
    
    console.log('✅ FCM log preservation enabled');
};

// Function to view preserved logs
window.getFCMLogs = function() {
    const logs = JSON.parse(localStorage.getItem('fcmLogs') || '[]');
    console.log('📋 FCM Logs History:');
    logs.forEach(log => console.log(log));
    return logs;
};

// Function to clear preserved logs
window.clearFCMLogs = function() {
    localStorage.removeItem('fcmLogs');
    console.log('🗑️ FCM logs cleared');
};

// Function to disable log preservation (if causing issues)
window.disableFCMLogPreservation = function() {
    console.log('📋 Disabling FCM log preservation...');
    // This will restore original console functions on page reload
    localStorage.removeItem('fcmLogs');
    console.log('✅ FCM log preservation disabled - refresh page to apply');
};

// DO NOT auto-enable log preservation to prevent page reload issues
console.log('📋 FCM log preservation is DISABLED by default to prevent page reload issues');
console.log('📋 To enable: run enableFCMLogPreservation() in console');
console.log('📋 To view logs: run getFCMLogs() in console');
console.log('📋 To clear logs: run clearFCMLogs() in console');

// Clear any existing logs that might be causing issues
localStorage.removeItem('fcmLogs');
sessionStorage.removeItem('debugLogs');
console.log('🗑️ Cleared any existing debug logs to prevent spam');

// Create a simple debug panel that doesn't interfere with page
window.createFCMDebugPanel = function() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('fcm-debug-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'fcm-debug-panel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        background: #1a1a1a;
        color: #fff;
        border: 1px solid #333;
        border-radius: 5px;
        padding: 10px;
        font-family: monospace;
        font-size: 11px;
        z-index: 9999;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        width: 20px;
        height: 20px;
        font-size: 10px;
    `;
    closeBtn.onclick = () => panel.remove();
    
    const title = document.createElement('div');
    title.innerHTML = '🔥 FCM Debug Panel';
    title.style.cssText = `
        font-weight: bold;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #333;
    `;
    
    const content = document.createElement('div');
    content.id = 'fcm-debug-content';
    
    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(content);
    document.body.appendChild(panel);
    
    // Update content every 2 seconds
    const updateInterval = setInterval(() => {
        if (!document.getElementById('fcm-debug-panel')) {
            clearInterval(updateInterval);
            return;
        }
        
        const user = getCurrentUser();
        const token = localStorage.getItem('fcmToken');
        const logs = JSON.parse(localStorage.getItem('fcmLogs') || '[]').slice(-5); // Last 5 logs
        
        content.innerHTML = `
            <div>🔥 Firebase: ${typeof firebase !== 'undefined' ? '✅ Available' : '❌ Not available'}</div>
            <div>👤 User: ${user.userId ? `ID:${user.userId} Role:${user.role}` : '❌ Not logged in'}</div>
            <div>📱 Token: ${token ? (token.startsWith('demo-') ? '❌ Demo token' : '✅ Real token') : '❌ No token'}</div>
            <div style="margin-top: 10px; font-size: 10px;">
                <strong>Recent Logs:</strong><br>
                ${logs.length > 0 ? logs.join('<br>') : 'No logs preserved'}
            </div>
        `;
    }, 2000);
    
    console.log('🔥 FCM Debug Panel created - will not interfere with console logs');
};

// Auto-create debug panel on page load (optional)
// createFCMDebugPanel();
