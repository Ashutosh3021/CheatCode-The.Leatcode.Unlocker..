/**
 * ContainerManager
 * Singleton — manages the single in-page overlay modal.
 * Handles open/close, loading state, and outside-click dismissal.
 */

import { ElementHelperClass as H } from './ElementGenerator/ElementHelperClass.js';

let instance = null;

export class ContainerManager {
    static getInstance() {
        if (!instance) instance = new ContainerManager();
        return instance;
    }

    constructor() {
        if (instance) return instance;
        this._buildModal();
        instance = this;
    }

    _buildModal() {
        // Backdrop
        this.backdrop = H.create('div', {
            class: 'lc-unlock-backdrop',
            id: 'lc-unlock-backdrop',
        });

        // Modal box
        this.modal = H.create('div', {
            class: 'lc-unlock-modal',
            id: 'lc-unlock-modal',
            role: 'dialog',
            'aria-modal': 'true',
        });

        // Close button
        const closeBtn = H.create('button', {
            class: 'lc-unlock-close-btn',
            'aria-label': 'Close',
            id: 'lc-unlock-close-btn',
        }, '✕');
        closeBtn.addEventListener('click', () => this.close());

        // Content area
        this.content = H.create('div', { class: 'lc-unlock-modal-content' });

        this.modal.appendChild(closeBtn);
        this.modal.appendChild(this.content);
        this.backdrop.appendChild(this.modal);
        document.body.appendChild(this.backdrop);

        // Close on backdrop click (outside modal)
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) this.close();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    /** Open modal and set content. */
    open(contentEl) {
        this.content.innerHTML = '';
        this.content.appendChild(contentEl);
        this.backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /** Show a loading spinner inside the modal. */
    openLoading(message = 'Loading…') {
        const loader = H.create('div', { class: 'lc-unlock-loader' },
            H.create('div', { class: 'lc-unlock-spinner' }),
            H.create('p', {}, message),
        );
        this.open(loader);
    }

    /** Replace modal content (after data loads). */
    setContent(contentEl) {
        this.content.innerHTML = '';
        this.content.appendChild(contentEl);
    }

    /** Close and clear the modal. */
    close() {
        this.backdrop.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => { this.content.innerHTML = ''; }, 300);
    }

    /** Returns true if modal is currently open. */
    isOpen() {
        return this.backdrop.classList.contains('visible');
    }
}
