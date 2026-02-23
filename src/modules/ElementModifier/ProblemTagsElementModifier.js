/**
 * ProblemTagsElementModifier
 * Patches the company-tags section on a problem detail page.
 * Replaces premium-locked tag placeholders with real chip elements.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class ProblemTagsElementModifier {
    /**
     * Find and replace the locked tags container with real content.
     * @param {HTMLElement} realContent - Built by TagsContentBuilder
     */
    static inject(realContent) {
        // Selectors that LeetCode uses for the premium tags wall
        const selectors = [
            '[class*="company-tags"]',
            '[class*="companyTags"]',
            '[class*="tag-container"]',
            '[id*="company"]',
        ];

        let target = null;
        for (const sel of selectors) {
            target = document.querySelector(sel);
            if (target) break;
        }

        if (!target) {
            console.warn('[LC-Unlock] ProblemTagsElementModifier: tags container not found.');
            return;
        }

        target.innerHTML = '';
        target.appendChild(realContent);
    }

    /**
     * Remove a premium upgrade prompt / paywall banner near tags.
     */
    static removePaywall() {
        document.querySelectorAll(
            '[class*="upgrade"], [class*="premium-banner"], [class*="locked-content"]'
        ).forEach((el) => el.remove());
    }
}
