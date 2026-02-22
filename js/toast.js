// ===== TOAST NOTIFICATION SYSTEM =====

let toastState = {
    container: null,
    toasts: [],
    maxToasts: 5,
    defaultDuration: 4000,
};

// Initialize toast system
function initializeToast() {
    // Create container if it doesn't exist
    if (!toastState.container) {
        toastState.container = document.getElementById('toastContainer');
        if (!toastState.container) {
            toastState.container = createToastContainer();
        }
    }
}

// Create toast container
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Show toast notification
function showToast(message, type = 'info', options = {}) {
    const {
        duration = toastState.defaultDuration,
        persistent = false,
        actions = null,
        icon = null,
        title = null
    } = options;
    
    initializeToast();
    
    // Remove oldest toast if max reached
    if (toastState.toasts.length >= toastState.maxToasts) {
        const oldestToast = toastState.toasts[0];
        removeToast(oldestToast);
    }
    
    // Create toast element
    const toast = createToastElement(message, type, options);
    
    // Add to container
    toastState.container.appendChild(toast);
    
    // Add to tracking
    toastState.toasts.push(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Setup auto-remove if not persistent
    if (!persistent) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

// Create toast element
function createToastElement(message, type, options) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon
    const iconClass = options.icon || getToastIcon(type);
    
    // Create toast content
    let contentHTML = `
        <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="toast-content">
            ${options.title ? `<h4 class="toast-title">${options.title}</h4>` : ''}
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" aria-label="Close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add actions if provided
    if (options.actions && options.actions.length > 0) {
        const actionsHTML = options.actions.map(action => `
            <button class="toast-action ${action.class || 'btn-outline'}" 
                    data-action="${action.action || ''}">
                ${action.text}
            </button>
        `).join('');
        
        contentHTML += `
            <div class="toast-actions">
                ${actionsHTML}
            </div>
        `;
    }
    
    toast.innerHTML = contentHTML;
    
    // Setup event listeners
    setupToastEventListeners(toast, options);
    
    return toast;
}

// Get toast icon based on type
function getToastIcon(type) {
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    return iconMap[type] || iconMap.info;
}

// Setup toast event listeners
function setupToastEventListeners(toast, options) {
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
    }
    
    // Action buttons
    const actionButtons = toast.querySelectorAll('.toast-action');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            // Call action handler if provided
            if (options.onAction) {
                options.onAction(action, toast);
            }
            
            // Remove toast after action
            removeToast(toast);
        });
    });
    
    // Click to dismiss (if not persistent)
    if (!options.persistent) {
        toast.addEventListener('click', (e) => {
            // Don't close if clicking on action buttons
            if (!e.target.closest('.toast-actions')) {
                removeToast(toast);
            }
        });
    }
    
    // Hover to pause auto-remove
    toast.addEventListener('mouseenter', () => {
        toast.classList.add('paused');
    });
    
    toast.addEventListener('mouseleave', () => {
        toast.classList.remove('paused');
    });
}

// Remove toast
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    // Add hide animation
    toast.classList.add('hide');
    
    // Remove after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        
        // Remove from tracking
        const index = toastState.toasts.indexOf(toast);
        if (index > -1) {
            toastState.toasts.splice(index, 1);
        }
    }, 300);
}

// Remove all toasts
function removeAllToasts() {
    const toasts = [...toastState.toasts];
    toasts.forEach(toast => removeToast(toast));
}

// Show success toast
function showSuccessToast(message, options = {}) {
    return showToast(message, 'success', options);
}

// Show error toast
function showErrorToast(message, options = {}) {
    return showToast(message, 'error', {
        duration: 6000, // Errors stay longer
        persistent: options.persistent || false,
        ...options
    });
}

// Show warning toast
function showWarningToast(message, options = {}) {
    return showToast(message, 'warning', options);
}

// Show info toast
function showInfoToast(message, options = {}) {
    return showToast(message, 'info', options);
}

// Show loading toast
function showLoadingToast(message = 'Loading...', options = {}) {
    return showToast(message, 'info', {
        persistent: true,
        icon: 'fa-spinner fa-spin',
        ...options
    });
}

// Show progress toast
function showProgressToast(message, progress, options = {}) {
    const progressHTML = `
        <div class="toast-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
        </div>
    `;
    
    return showToast(message, 'info', {
        persistent: true,
        icon: 'fa-spinner fa-spin',
        ...options,
        customContent: progressHTML
    });
}

// Show confirmation toast
function showConfirmToast(message, onConfirm, options = {}) {
    return showToast(message, 'warning', {
        persistent: true,
        actions: [
            { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
            { text: 'Confirm', class: 'btn-primary', action: 'confirm' }
        ],
        onAction: (action) => {
            if (action === 'confirm' && onConfirm) {
                onConfirm();
            }
        },
        ...options
    });
}

// Update toast message
function updateToast(toast, newMessage, newType = null) {
    if (!toast) return;
    
    const messageElement = toast.querySelector('.toast-message');
    if (messageElement) {
        messageElement.textContent = newMessage;
    }
    
    if (newType) {
        // Update toast class
        toast.className = toast.className.replace(/toast-\w+/, `toast-${newType}`);
        
        // Update icon
        const iconElement = toast.querySelector('.toast-icon i');
        if (iconElement) {
            iconElement.className = `fas ${getToastIcon(newType)}`;
        }
    }
}

// Show toast with custom HTML
function showCustomToast(html, options = {}) {
    initializeToast();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${options.type || 'info'}`;
    toast.innerHTML = html;
    
    // Setup close button if present
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => removeToast(toast));
    }
    
    toastState.container.appendChild(toast);
    toastState.toasts.push(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    if (!options.persistent) {
        setTimeout(() => removeToast(toast), options.duration || toastState.defaultDuration);
    }
    
    return toast;
}

// Toast positioning
function setToastPosition(position = 'top-right') {
    if (!toastState.container) return;
    
    // Remove existing position classes
    toastState.container.className = toastState.container.className.replace(/toast-position-\w+/, '');
    
    // Add new position class
    toastState.container.classList.add(`toast-position-${position}`);
}

// Configure toast defaults
function configureToast(options) {
    if (options.maxToasts) toastState.maxToasts = options.maxToasts;
    if (options.defaultDuration) toastState.defaultDuration = options.defaultDuration;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initializeToast();
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showSuccessToast,
        showErrorToast,
        showWarningToast,
        showInfoToast,
        showLoadingToast,
        showProgressToast,
        showConfirmToast,
        showCustomToast,
        updateToast,
        removeToast,
        removeAllToasts,
        setToastPosition,
        configureToast,
    };
}
