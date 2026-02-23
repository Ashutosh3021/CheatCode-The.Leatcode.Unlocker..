/**
 * EditorialContentBuilder
 * Assembles the editorial/solution content shown in a modal.
 * HTML is sanitized via DOMPurify before injection.
 * 🟢 Feature: Prism.js syntax highlighting for code blocks.
 * 🔴 Fix: Content sanitized with DOMPurify — no XSS risk.
 */

import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-javascript';

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class EditorialContentBuilder {
    /**
     * Build a sanitized, syntax-highlighted editorial panel.
     * @param {Object} editorial
     * @param {string} editorial.title       - Problem title
     * @param {string} editorial.content     - Raw HTML editorial content
     * @param {string} [editorial.difficulty]
     * @returns {HTMLElement}
     */
    static build(editorial) {
        const { title, content, difficulty } = editorial;

        const wrapper = H.create('div', { class: 'lc-unlock-editorial-wrap' });

        // ── Title bar ─────────────────────────────────────────────────────────────
        const titleBar = H.create('div', { class: 'lc-unlock-editorial-title' },
            H.create('h2', {}, title ?? 'Editorial'),
            difficulty
                ? H.create('span', { class: `lc-unlock-difficulty lc-diff-${difficulty?.toLowerCase()}` }, difficulty)
                : null,
        );

        // ── Sanitized content body ────────────────────────────────────────────────
        const body = H.create('div', { class: 'lc-unlock-editorial-body' });
        const sanitized = DOMPurify.sanitize(content ?? '', {
            USE_PROFILES: { html: true },
            ADD_TAGS: ['pre', 'code'],
        });
        body.innerHTML = sanitized;

        // ── Prism.js syntax highlight ─────────────────────────────────────────────
        body.querySelectorAll('pre code').forEach((block) => {
            Prism.highlightElement(block);
        });

        wrapper.appendChild(titleBar);
        wrapper.appendChild(body);
        return wrapper;
    }

    /**
     * Build a loading placeholder shown while editorial is being fetched.
     * @returns {HTMLElement}
     */
    static buildLoader() {
        return H.create('div', { class: 'lc-unlock-loader' },
            H.create('div', { class: 'lc-unlock-spinner' }),
            H.create('p', {}, 'Loading editorial…'),
        );
    }
}
