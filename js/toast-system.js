// ===== CENTRALIZED TOAST NOTIFICATION SYSTEM =====

class ToastSystem {
    constructor() {
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 4000;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    show(options = {}) {
        const {
            message = '',
            type = 'info',
            duration = this.defaultDuration,
            persistent = false,
            actions = []
        } = options;

        const toast = {
            id: Date.now(),
            message,
            type,
            duration,
            persistent,
            actions
        };

        this.toasts.push(toast);
        this.render();

        if (!persistent) {
            setTimeout(() => {
                this.remove(toast.id);
            }, duration);
        }

        return toast.id;
    }

    remove(id) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index > -1) {
            this.toasts.splice(index, 1);
            this.render();
        }
    }

    clear() {
        this.toasts = [];
        this.render();
    }

    render() {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        // Limit number of toasts
        const visibleToasts = this.toasts.slice(-this.maxToasts);
        
        container.innerHTML = visibleToasts.map(toast => `
            <div class="toast toast-${toast.type} ${this.toasts.length > this.maxToasts ? 'toast-exit' : ''}" data-toast-id="${toast.id}">
                <div class="toast-content">
                    <div class="toast-icon">
                        ${this.getIcon(toast.type)}
                    </div>
                    <div class="toast-message">${toast.message}</div>
                    ${!toast.persistent ? `
                        <button class="toast-close" onclick="toastSystem.remove(${toast.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
                ${toast.actions.length > 0 ? `
                    <div class="toast-actions">
                        ${toast.actions.map(action => `
                            <button class="btn btn-sm ${action.class || 'btn-outline'}" onclick="${action.onclick}">
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Trigger animations
        setTimeout(() => {
            const toastElements = container.querySelectorAll('.toast');
            toastElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('toast-show');
                }, index * 50);
            });
        }, 10);
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show({ ...options, message, type: 'success' });
    }

    error(message, options = {}) {
        return this.show({ ...options, message, type: 'error', duration: 6000 });
    }

    warning(message, options = {}) {
        return this.show({ ...options, message, type: 'warning' });
    }

    info(message, options = {}) {
        return this.show({ ...options, message, type: 'info' });
    }

    loading(message = 'Loading...', options = {}) {
        return this.show({ ...options, message, type: 'info', persistent: true });
    }
}

// Global instance
window.toastSystem = new ToastSystem();

// Helper functions
window.showToast = (options) => toastSystem.show(options);
window.showSuccess = (message, options) => toastSystem.success(message, options);
window.showError = (message, options) => toastSystem.error(message, options);
window.showWarning = (message, options) => toastSystem.warning(message, options);
window.showInfo = (message, options) => toastSystem.info(message, options);
window.showLoading = (message, options) => toastSystem.loading(message, options);
