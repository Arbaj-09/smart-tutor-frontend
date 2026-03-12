// ===== CENTRALIZED MODAL SYSTEM =====

class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.originalBodyOverflow = '';
        this.init();
    }

    init() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('modalContainer')) {
            const container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }
        
        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    show(options = {}) {
        const {
            title = '',
            content = '',
            size = 'medium',
            showCloseButton = true,
            backdropClose = true,
            customClass = '',
            customActions = ''
        } = options;

        console.log('🧪 Modal show() called');

        // CRITICAL: Force hide all skeletons AND loading overlays
        document.querySelectorAll('.skeleton-loader').forEach(el => {
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
        });
        document.querySelectorAll('.loading-overlay, #loadingOverlay').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
        });

        // Store original body overflow
        this.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.style.pointerEvents = 'auto';

        const modalHTML = `
            <div class="modal-overlay modal-overlay-show" id="modalOverlay" style="visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;">
                <div class="modal modal-show modal-${size} ${customClass}" id="modalContent" style="visibility: visible !important; z-index: 100000 !important; pointer-events: auto !important; display: flex !important; flex-direction: column !important;">
                    ${showCloseButton ? `
                        <button class="modal-close" id="modalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${title ? `
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                        </div>
                    ` : ''}
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${customActions ? `
                        <div class="modal-footer">
                            ${customActions}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // CRITICAL: Always append to body, not container
        let container = document.getElementById('modalContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }
        container.innerHTML = modalHTML;

        console.log('🧪 Modal element:', document.querySelector('.modal'));
        console.log('🧪 Modal z-index:', getComputedStyle(document.querySelector('.modal')).zIndex);
        console.log('🧪 Modal visibility:', getComputedStyle(document.querySelector('.modal-overlay')).visibility);
        console.log('🧪 Modal pointer-events:', getComputedStyle(document.querySelector('.modal-overlay')).pointerEvents);

        // Add event listeners
        const closeBtn = document.getElementById('modalClose');
        const overlay = document.getElementById('modalOverlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (backdropClose && overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        this.activeModal = true;
        console.log('✅ Modal visible on screen');
    }

    close() {
        const modalEl = document.getElementById('modalContent');
        const overlay = document.getElementById('modalOverlay');

        if (modalEl) {
            modalEl.classList.remove('modal-show');
        }

        if (overlay) {
            overlay.classList.remove('modal-overlay-show');
        }

        setTimeout(() => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
            this.activeModal = null;
            document.body.style.overflow = this.originalBodyOverflow;
            document.body.style.pointerEvents = 'auto';
        }, 300);
    }

    confirm(options = {}) {
        const {
            title = 'Confirm',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-primary',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        console.log('⚠️ Confirmation dialog triggered');

        return new Promise((resolve) => {
            const content = `
                <div class="confirm-modal">
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-outline" id="confirmCancel">${cancelText}</button>
                        <button class="btn ${confirmClass}" id="confirmOk">${confirmText}</button>
                    </div>
                </div>
            `;

            this.show({
                title,
                content,
                size: 'small',
                backdropClose: false
            });

            console.log('⚠️ Confirmation dialog visible');

            setTimeout(() => {
                const confirmBtn = document.getElementById('confirmOk');
                const cancelBtn = document.getElementById('confirmCancel');

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        this.close();
                        onConfirm();
                        resolve(true);
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        this.close();
                        onCancel();
                        resolve(false);
                    });
                }
            }, 100);
        });
    }

    alert(options = {}) {
        const {
            title = 'Alert',
            message = '',
            buttonText = 'OK',
            onOk = () => {}
        } = options;

        const content = `
            <div class="alert-modal">
                <p class="alert-message">${message}</p>
                <div class="alert-actions">
                    <button class="btn btn-primary" id="alertOk">${buttonText}</button>
                </div>
            </div>
        `;

        this.show({
            title,
            content,
            size: 'small',
            backdropClose: false
        });

        setTimeout(() => {
            const okBtn = document.getElementById('alertOk');
            if (okBtn) {
                okBtn.addEventListener('click', () => {
                    this.close();
                    onOk();
                });
            }
        }, 100);
    }
}

// Global instance
window.modalSystem = new ModalSystem();

// Helper functions
window.showModal = (options) => modalSystem.show(options);
window.closeModal = () => modalSystem.close();
window.showConfirm = (options) => modalSystem.confirm(options);
window.showAlert = (options) => modalSystem.alert(options);
