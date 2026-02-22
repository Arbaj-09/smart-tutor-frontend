// ===== LOADING UTILITY =====

let loadingState = {
    overlay: null,
    loadingCount: 0,
    loadingMessages: [],
};

// Initialize loading system
function initializeLoading() {
    // Create loading overlay if it doesn't exist
    if (!loadingState.overlay) {
        loadingState.overlay = document.getElementById('loadingOverlay');
        if (!loadingState.overlay) {
            loadingState.overlay = createLoadingOverlay();
        }
    }
}

// Create loading overlay
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay hidden';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-message">Loading...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// Show loading
function showLoading(message = 'Loading...') {
    initializeLoading();
    
    loadingState.loadingCount++;
    loadingState.loadingMessages.push(message);
    
    // Update message
    const messageElement = loadingState.overlay.querySelector('.loading-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    // Show overlay
    loadingState.overlay.classList.remove('hidden');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Hide loading
function hideLoading() {
    if (loadingState.loadingCount > 0) {
        loadingState.loadingCount--;
        loadingState.loadingMessages.pop();
    }
    
    // Only hide if no more loading operations
    if (loadingState.loadingCount === 0) {
        loadingState.overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    // Update message to previous one if exists
    if (loadingState.loadingMessages.length > 0) {
        const messageElement = loadingState.overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = loadingState.loadingMessages[loadingState.loadingMessages.length - 1];
        }
    }
}

// Hide all loading immediately
function hideAllLoading() {
    loadingState.loadingCount = 0;
    loadingState.loadingMessages = [];
    
    if (loadingState.overlay) {
        loadingState.overlay.classList.add('hidden');
    }
    
    document.body.style.overflow = '';
}

// Show loading with progress
function showProgressLoading(message = 'Loading...', progress = 0) {
    showLoading(message);
    
    // Add progress bar if not exists
    let progressBar = loadingState.overlay.querySelector('.progress-bar');
    if (!progressBar) {
        const content = loadingState.overlay.querySelector('.loading-content');
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${progress}%"></div>
            <span class="progress-text">${progress}%</span>
        `;
        content.appendChild(progressBar);
    } else {
        // Update existing progress bar
        const progressFill = progressBar.querySelector('.progress-fill');
        const progressText = progressBar.querySelector('.progress-text');
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
    }
}

// Update progress
function updateProgress(progress, message = null) {
    if (loadingState.loadingCount === 0) return;
    
    const progressBar = loadingState.overlay.querySelector('.progress-bar');
    if (progressBar) {
        const progressFill = progressBar.querySelector('.progress-fill');
        const progressText = progressBar.querySelector('.progress-text');
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
    }
    
    if (message) {
        const messageElement = loadingState.overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

// Show loading with steps
function showStepLoading(steps = []) {
    showLoading('Initializing...');
    
    // Create steps display
    let stepsContainer = loadingState.overlay.querySelector('.loading-steps');
    if (!stepsContainer) {
        const content = loadingState.overlay.querySelector('.loading-content');
        stepsContainer = document.createElement('div');
        stepsContainer.className = 'loading-steps';
        content.appendChild(stepsContainer);
    }
    
    // Generate steps HTML
    stepsContainer.innerHTML = steps.map((step, index) => `
        <div class="loading-step" data-step="${index}">
            <div class="step-indicator">
                <div class="step-number">${index + 1}</div>
                <div class="step-line"></div>
            </div>
            <div class="step-content">
                <h4>${step.title}</h4>
                <p>${step.description}</p>
            </div>
        </div>
    `).join('');
    
    return {
        setCurrentStep: (stepIndex) => {
            const stepElements = stepsContainer.querySelectorAll('.loading-step');
            stepElements.forEach((step, index) => {
                if (index <= stepIndex) {
                    step.classList.add('completed');
                } else {
                    step.classList.remove('completed');
                }
            });
            
            // Update message
            if (steps[stepIndex]) {
                const messageElement = loadingState.overlay.querySelector('.loading-message');
                if (messageElement) {
                    messageElement.textContent = steps[stepIndex].title;
                }
            }
        }
    };
}

// Show loading with spinner variants
function showCustomLoading(type = 'default', message = 'Loading...') {
    showLoading(message);
    
    const spinner = loadingState.overlay.querySelector('.spinner');
    if (spinner) {
        // Remove existing spinner classes
        spinner.className = 'spinner';
        
        // Add type-specific class
        spinner.classList.add(`spinner-${type}`);
    }
}

// Loading types
const LoadingTypes = {
    DEFAULT: 'default',
    DOTS: 'dots',
    PULSE: 'pulse',
    BOUNCE: 'bounce',
    ROTATE: 'rotate'
};

// Show loading with timeout
function showLoadingWithTimeout(message = 'Loading...', timeout = 10000) {
    showLoading(message);
    
    setTimeout(() => {
        if (loadingState.loadingCount > 0) {
            hideLoading();
            showToast('Loading timeout. Please try again.', 'warning');
        }
    }, timeout);
}

// Execute function with loading
async function executeWithLoading(fn, message = 'Loading...') {
    try {
        showLoading(message);
        const result = await fn();
        return result;
    } finally {
        hideLoading();
    }
}

// Execute multiple functions with loading
async function executeAllWithLoading(functions, message = 'Loading...') {
    try {
        showLoading(message);
        const results = await Promise.all(functions.map(fn => fn()));
        return results;
    } finally {
        hideLoading();
    }
}

// Check if currently loading
function isLoading() {
    return loadingState.loadingCount > 0;
}

// Get loading message
function getLoadingMessage() {
    return loadingState.loadingMessages.length > 0 
        ? loadingState.loadingMessages[loadingState.loadingMessages.length - 1]
        : '';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initializeLoading();
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading,
        hideLoading,
        hideAllLoading,
        showProgressLoading,
        updateProgress,
        showStepLoading,
        showCustomLoading,
        showLoadingWithTimeout,
        executeWithLoading,
        executeAllWithLoading,
        isLoading,
        getLoadingMessage,
        LoadingTypes
    };
}
