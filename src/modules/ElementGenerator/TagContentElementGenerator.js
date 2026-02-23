/**
 * TagContentElementGenerator
 * Generates company-tag chip elements shown on problem detail pages.
 * 🟢 Fix: Uses LeetCode CSS custom properties for consistent dark/light mode.
 */

import { ElementHelperClass as H } from './ElementHelperClass.js';

export class TagContentElementGenerator {
    /**
     * Build a clickable chip for a single company tag.
     * @param {string} company  - Company name
     * @param {number} count    - Number of times this company asked the problem
     * @param {Function} [onClick]
     * @returns {HTMLElement}
     */
    static buildChip(company, count, onClick) {
        const chip = H.create('span', { class: 'lc-unlock-company-chip' },
            H.create('span', { class: 'lc-unlock-chip-name' }, company),
            H.create('span', { class: 'lc-unlock-chip-count' }, String(count)),
        );

        if (typeof onClick === 'function') {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick(company);
            });
        }

        return chip;
    }

    /**
     * Build a container of company chips.
     * @param {Array<{company: string, count: number}>} companies
     * @param {Function} [onChipClick]
     * @returns {HTMLElement}
     */
    static buildChipContainer(companies, onChipClick) {
        const container = H.create('div', { class: 'lc-unlock-company-chips' });

        for (const { company, count } of companies) {
            container.appendChild(
                TagContentElementGenerator.buildChip(company, count, onChipClick)
            );
        }

        return container;
    }

    /**
     * Build a time-window tab strip (6 Months / 1 Year / 2 Years / All Time).
     * @param {string[]} windows     - Array of label strings
     * @param {number} activeIndex   - Index of initially active tab
     * @param {Function} onTabChange - called with index when tab changes
     * @returns {HTMLElement}
     */
    static buildTabStrip(windows, activeIndex, onTabChange) {
        const strip = H.create('div', { class: 'lc-unlock-tab-strip' });

        windows.forEach((label, i) => {
            const tab = H.create('button', {
                class: `lc-unlock-tab${i === activeIndex ? ' active' : ''}`,
                'data-index': String(i),
            }, label);

            tab.addEventListener('click', () => {
                strip.querySelectorAll('.lc-unlock-tab').forEach((t) =>
                    t.classList.remove('active')
                );
                tab.classList.add('active');
                if (typeof onTabChange === 'function') onTabChange(i);
            });

            strip.appendChild(tab);
        });

        return strip;
    }
}
