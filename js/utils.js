// ===== UTILITY FUNCTIONS =====

// Date formatting
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// HTML escaping
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Loading states
function showGlobalLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideGlobalLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// Form validation helpers
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Pagination helpers
function updatePaginationInfo(start, end, total, containerId = 'paginationInfo') {
    const info = document.getElementById(containerId);
    if (info) {
        if (total === 0) {
            info.textContent = 'No items found';
        } else {
            info.textContent = `Showing ${start}-${end} of ${total}`;
        }
    }
}

// Error display function
function showError(message) {
    console.error(message);
    if (window.showToast) {
        showToast(message, 'error');
    } else {
        alert(message);
    }
}

// Success display function
function showSuccess(message) {
    if (window.showToast) {
        showToast(message, 'success');
    } else {
        alert(message);
    }
}

// Confirm dialog (returns Promise<boolean>)
function showConfirm(message) {
    return new Promise(resolve => {
        resolve(window.confirm(message));
    });
}

// Global error handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.showError) {
        showError('An unexpected error occurred. Please try again.');
    }
});

// Export functions globally
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.escapeHtml = escapeHtml;
window.debounce = debounce;
window.isValidEmail = isValidEmail;
window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;
window.clearFormErrors = clearFormErrors;
window.showFieldError = showFieldError;
window.updatePaginationInfo = updatePaginationInfo;
window.showError = showError;
window.showSuccess = showSuccess;
window.showConfirm = showConfirm;