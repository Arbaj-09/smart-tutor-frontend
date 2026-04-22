// ===== MODAL FUNCTIONALITY =====

let modalState = {
    activeModal: null,
    modalStack: [],
};

// Modal templates
const modalTemplates = {
    // Confirmation modal
    confirm: {
        title: 'Confirm Action',
        content: 'Are you sure you want to proceed?',
        buttons: [
            { text: 'Cancel', class: 'btn-outline', action: 'close' },
            { text: 'Confirm', class: 'btn-primary', action: 'confirm' }
        ]
    },
    
    // Alert modal
    alert: {
        title: 'Alert',
        content: 'Operation completed successfully!',
        buttons: [
            { text: 'OK', class: 'btn-primary', action: 'close' }
        ]
    },
    
    // Form modal
    form: {
        title: 'Form',
        content: '<form id="modalForm"></form>',
        buttons: [
            { text: 'Cancel', class: 'btn-outline', action: 'close' },
            { text: 'Submit', class: 'btn-primary', action: 'submit' }
        ]
    }
};

// Show modal
function showModal(options = {}) {
    const {
        type = 'alert',
        title = null,
        content = null,
        buttons = null,
        customActions = null,
        size = 'medium',
        closeOnOverlay = true,
        onConfirm = null,
        onCancel = null,
        onSubmit = null,
        customClass = ''
    } = options;
    
    // Get template
    const template = modalTemplates[type];
    if (!template && !title) {
        console.error('Modal type not found:', type);
        return;
    }
    
    // Create modal HTML
    const modalHTML = createModalHTML({
        title: title || template.title,
        content: content || template.content,
        buttons: buttons || template.buttons,
        customActions,
        size,
        customClass
    });
    
    // Add to DOM
    const container = document.getElementById('modalContainer') || createModalContainer();
    container.innerHTML = modalHTML;
    
    // Get modal elements
    const modal = container.querySelector('.modal-overlay');
    const modalElement = container.querySelector('.modal');
    
    // Setup modal
    setupModal(modal, modalElement, {
        closeOnOverlay,
        onConfirm,
        onCancel,
        onSubmit
    });
    
    // Show modal
    requestAnimationFrame(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Track modal
    modalState.activeModal = modal;
    modalState.modalStack.push(modal);
    
    return modal;
}

// Create modal HTML
function createModalHTML(options) {
    const { title, content, buttons, customActions, size, customClass } = options;
    
    let footerHTML = '';
    if (customActions) {
        footerHTML = `<div class="modal-footer">${customActions}</div>`;
    } else if (buttons) {
        footerHTML = `
            <div class="modal-footer">
                ${buttons.map(btn => `
                    <button class="btn ${btn.class}" data-action="${btn.action}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="modal-overlay ${customClass}">
            <div class="modal modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" data-action="close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footerHTML}
            </div>
        </div>
    `;
}

// Setup modal event listeners
function setupModal(modal, modalElement, options) {
    const { closeOnOverlay, onConfirm, onCancel, onSubmit } = options;
    
    // Close button
    const closeBtn = modalElement.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal, onCancel));
    }
    
    // Overlay click
    if (closeOnOverlay) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal, onCancel);
            }
        });
    }
    
    // Action buttons
    const actionButtons = modalElement.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]').dataset.action;
            handleModalAction(action, modal, { onConfirm, onCancel, onSubmit });
        });
    });
    
    // Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal, onCancel);
        }
    };
    modal.addEventListener('keydown', escapeHandler);
    
    // Store handler for cleanup
    modal._escapeHandler = escapeHandler;
}

// Handle modal actions
function handleModalAction(action, modal, callbacks) {
    const { onConfirm, onCancel, onSubmit } = callbacks;
    
    switch (action) {
        case 'close':
            closeModal(modal, onCancel);
            break;
            
        case 'confirm':
            if (onConfirm) {
                const result = onConfirm(modal);
                if (result !== false) {
                    closeModal(modal);
                }
            } else {
                closeModal(modal);
            }
            break;
            
        case 'submit':
            if (onSubmit) {
                const form = modal.querySelector('#modalForm');
                if (form) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    const result = onSubmit(data, modal);
                    if (result !== false) {
                        closeModal(modal);
                    }
                } else {
                    if (onSubmit) {
                        const result = onSubmit(modal);
                        if (result !== false) {
                            closeModal(modal);
                        }
                    } else {
                        closeModal(modal);
                    }
                }
            }
            break;
    }
}

// Close modal
function closeModal(modal, callback = null) {
    if (!modal) {
        // No arg passed — close the topmost active modal
        modal = modalState.activeModal;
        if (!modal) return;
    }
    
    modal.classList.remove('active');
    
    setTimeout(() => {
        // Remove from DOM
        modal.remove();
        
        // Remove from stack
        const index = modalState.modalStack.indexOf(modal);
        if (index > -1) {
            modalState.modalStack.splice(index, 1);
        }
        
        // Update active modal
        modalState.activeModal = modalState.modalStack.length > 0 
            ? modalState.modalStack[modalState.modalStack.length - 1] 
            : null;
        
        // Restore body scroll
        if (modalState.modalStack.length === 0) {
            document.body.style.overflow = '';
        }
        
        // Execute callback
        if (callback) {
            callback();
        }
    }, 300);
}

// Close all modals
function closeAllModals() {
    const modals = [...modalState.modalStack];
    modals.forEach(modal => closeModal(modal));
}

// Show confirmation modal
function showConfirmModal(message, onConfirm, options = {}) {
    return showModal({
        type: 'confirm',
        content: `<p>${message}</p>`,
        onConfirm,
        ...options
    });
}

// Show alert modal
function showAlertModal(message, options = {}) {
    return showModal({
        type: 'alert',
        content: `<p>${message}</p>`,
        ...options
    });
}

// Show form modal
function showFormModal(title, formFields, onSubmit, options = {}) {
    const formHTML = generateFormHTML(formFields);
    
    return showModal({
        type: 'form',
        title,
        content: formHTML,
        onSubmit,
        ...options
    });
}

// Generate form HTML
function generateFormHTML(fields) {
    const formFields = fields.map(field => {
        const { type, name, label, placeholder, required, options, value } = field;
        
        let fieldHTML = '';
        
        switch (type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'tel':
                fieldHTML = `
                    <div class="form-group">
                        <label for="${name}" class="form-label">${label}</label>
                        <input type="${type}" id="${name}" name="${name}" 
                               class="form-control" placeholder="${placeholder || ''}"
                               ${required ? 'required' : ''} value="${value || ''}">
                    </div>
                `;
                break;
                
            case 'select':
                fieldHTML = `
                    <div class="form-group">
                        <label for="${name}" class="form-label">${label}</label>
                        <select id="${name}" name="${name}" class="form-control" 
                                ${required ? 'required' : ''}>
                            <option value="">Select ${label}</option>
                            ${options.map(opt => `
                                <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                                    ${opt.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;
                
            case 'textarea':
                fieldHTML = `
                    <div class="form-group">
                        <label for="${name}" class="form-label">${label}</label>
                        <textarea id="${name}" name="${name}" class="form-control" 
                                  placeholder="${placeholder || ''}" rows="4"
                                  ${required ? 'required' : ''}>${value || ''}</textarea>
                    </div>
                `;
                break;
                
            case 'checkbox':
                fieldHTML = `
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="${name}" name="${name}" 
                                   ${value ? 'checked' : ''}>
                            ${label}
                        </label>
                    </div>
                `;
                break;
                
            case 'file':
                fieldHTML = `
                    <div class="form-group">
                        <label for="${name}" class="form-label">${label}</label>
                        <input type="file" id="${name}" name="${name}" class="form-control"
                               ${required ? 'required' : ''}>
                    </div>
                `;
                break;
        }
        
        return fieldHTML;
    }).join('');
    
    return `<form id="modalForm">${formFields}</form>`;
}

// Create modal container
function createModalContainer() {
    const container = document.createElement('div');
    container.id = 'modalContainer';
    document.body.appendChild(container);
    return container;
}

// Loading modal
function showLoadingModal(message = 'Loading...') {
    return showModal({
        title: 'Please Wait',
        content: `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `,
        closeOnOverlay: false,
        customClass: 'loading-modal'
    });
}

// Progress modal
function showProgressModal(title, steps) {
    const stepsHTML = steps.map((step, index) => `
        <div class="progress-step" data-step="${index}">
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
    
    const modal = showModal({
        title,
        content: `
            <div class="progress-container">
                ${stepsHTML}
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
        `,
        closeOnOverlay: false,
        customClass: 'progress-modal'
    });
    
    return {
        modal,
        updateProgress: (currentStep) => {
            const progressSteps = modal.querySelectorAll('.progress-step');
            const progressBar = modal.querySelector('#progressBar');
            
            progressSteps.forEach((step, index) => {
                if (index <= currentStep) {
                    step.classList.add('completed');
                } else {
                    step.classList.remove('completed');
                }
            });
            
            const progress = ((currentStep + 1) / steps.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showModal,
        closeModal,
        closeAllModals,
        showConfirmModal,
        showAlertModal,
        showFormModal,
        showLoadingModal,
        showProgressModal,
    };
}
