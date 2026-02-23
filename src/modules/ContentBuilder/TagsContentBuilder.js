/**
 * TagsContentBuilder
 * Assembles the company-tags section shown on a problem detail page.
 * Renders chips grouped by time window with a tab strip.
 * 🟢 Feature: Live search filter for company chips.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';
import { TagContentElementGenerator as TagGen } from '../ElementGenerator/TagContentElementGenerator.js';
import { TIME_WINDOWS } from '../Objects.js';

export class TagsContentBuilder {
    /**
     * Build the tags section.
     * @param {Object[][]} companiesByWindow - Array per time window, each: [{company, count}]
     * @param {Function} [onChipClick]
     * @returns {HTMLElement}
     */
    static build(companiesByWindow, onChipClick) {
        let activeTab = 0;

        const wrapper = H.create('div', { class: 'lc-unlock-tags-wrap' });

        // ── Search filter ─────────────────────────────────────────────────────────
        const searchInput = H.create('input', {
            class: 'lc-unlock-search lc-unlock-search--sm',
            type: 'text',
            placeholder: 'Filter companies…',
        });

        // ── Tab strip ─────────────────────────────────────────────────────────────
        const tabStrip = TagGen.buildTabStrip(TIME_WINDOWS, activeTab, (idx) => {
            activeTab = idx;
            renderChips();
        });

        const chipsArea = H.create('div', { class: 'lc-unlock-chips-area' });

        const renderChips = () => {
            const query = searchInput.value.trim().toLowerCase();
            let companies = [...(companiesByWindow[activeTab] ?? [])];

            if (query) {
                companies = companies.filter((c) =>
                    c.company.toLowerCase().includes(query)
                );
            }

            // Sort by count desc
            companies.sort((a, b) => b.count - a.count);

            chipsArea.innerHTML = '';
            if (companies.length === 0) {
                chipsArea.appendChild(
                    H.create('p', { class: 'lc-unlock-empty' }, 'No companies found.')
                );
            } else {
                chipsArea.appendChild(TagGen.buildChipContainer(companies, onChipClick));
            }
        };

        searchInput.addEventListener('input', renderChips);
        renderChips();

        wrapper.appendChild(searchInput);
        wrapper.appendChild(tabStrip);
        wrapper.appendChild(chipsArea);
        return wrapper;
    }
}
