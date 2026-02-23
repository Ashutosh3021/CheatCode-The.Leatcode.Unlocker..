/**
 * ProblemTableElementModifier
 * Patches the /problemset/ page:
 * - Removes lock icons from premium problem rows
 * - Injects green frequency progress bars
 * - Rewires locked links to open our modal on click
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class ProblemTableElementModifier {
    /**
     * Inject frequency bar into a problem row element.
     * @param {Element} rowEl      - The <tr> or row container
     * @param {number}  frequency  - 0-100 normalized score
     */
    static injectFrequencyBar(rowEl, frequency) {
        const existing = rowEl.querySelector('.lc-unlock-freq-bar-wrap');
        if (existing) return; // Already patched

        const bar = H.create('div', { class: 'lc-unlock-freq-bar-wrap' },
            H.create('div', {
                class: 'lc-unlock-freq-bar-fill',
                style: { width: `${Math.min(100, Math.round(frequency))}%` },
            })
        );

        // Try to find a frequency/acceptance cell to place the bar into
        const cells = rowEl.querySelectorAll('td');
        const target = cells[cells.length - 1];
        if (target) target.appendChild(bar);
    }

    /**
     * Remove lock/blur indicators from a row.
     * @param {Element} rowEl
     */
    static removeLock(rowEl) {
        rowEl.querySelectorAll('[class*="lock"], [class*="blur"], [class*="premium"]')
            .forEach((el) => el.remove());

        // Remove inline blur filters
        rowEl.querySelectorAll('[style*="blur"]').forEach((el) => {
            el.style.filter = 'none';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        });
    }

    /**
     * Rewire a locked anchor to fire a click handler instead of navigating.
     * @param {Element} linkEl
     * @param {Function} onClick
     */
    static rewireLink(linkEl, onClick) {
        const clone = linkEl.cloneNode(true);
        clone.setAttribute('href', 'javascript:void(0)');
        clone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });
        linkEl.parentNode?.replaceChild(clone, linkEl);
    }
}
