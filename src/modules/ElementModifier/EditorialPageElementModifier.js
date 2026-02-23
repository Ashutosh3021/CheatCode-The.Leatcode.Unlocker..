/**
 * EditorialPageElementModifier
 * Patches the editorial tab on a problem detail page.
 * Replaces the premium paywall with a clickable trigger that opens the editorial modal.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class EditorialPageElementModifier {
    /**
     * Replace the premium editorial wall with a styled unlock button.
     * @param {Function} onUnlock - Called when user clicks the unlock prompt
     */
    static injectUnlockPrompt(onUnlock) {
        // Common containers LeetCode uses for the editorial paywall
        const selectors = [
            '[class*="editorial"]',
            '[class*="solution-content"]',
            '[data-key="editorial"]',
        ];

        let target = null;
        for (const sel of selectors) {
            target = document.querySelector(sel);
            if (target) break;
        }

        if (!target) {
            console.warn('[LC-Unlock] EditorialPageElementModifier: editorial container not found.');
            return;
        }

        // Remove existing paywall
        target.querySelectorAll('[class*="premium"], [class*="lock"], [class*="upgrade"]')
            .forEach((el) => el.remove());

        const prompt = H.create('div', { class: 'lc-unlock-editorial-prompt' },
            H.create('p', {}, '🔓 Editorial unlocked — click to view.'),
            H.create('button', {
                class: 'lc-unlock-btn',
                id: 'lc-unlock-editorial-btn',
                onclick: onUnlock,
            }, 'View Editorial'),
        );

        target.innerHTML = '';
        target.appendChild(prompt);
    }

    /**
     * Replace the prompt with the actual editorial content element.
     * @param {HTMLElement} contentEl - Built by EditorialContentBuilder
     */
    static showContent(contentEl) {
        const prompt = document.getElementById('lc-unlock-editorial-btn')?.parentElement;
        const target = prompt?.parentElement ?? document.querySelector('[class*="editorial"]');
        if (target) {
            target.innerHTML = '';
            target.appendChild(contentEl);
        }
    }
}
