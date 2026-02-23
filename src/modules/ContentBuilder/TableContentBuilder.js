/**
 * TableContentBuilder
 * Assembles the full sortable problem table with time-window tabs.
 * Tabs: 6 Months / 1 Year / 2 Years / All Time
 * 🟢 Feature: Live search/filter input added to company problem modal.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';
import { TableContentElementGenerator as RowGen } from '../ElementGenerator/TableContentElementGenerator.js';
import { TagContentElementGenerator as TabGen } from '../ElementGenerator/TagContentElementGenerator.js';
import { ProblemSorter } from '../ProblemSorter.js';
import { SORT_FIELDS, TIME_WINDOWS } from '../Objects.js';

export class TableContentBuilder {
    /**
     * Build a complete tabbed problem table.
     * @param {Object[][][]} problemsByWindow - Array of problem arrays, one per time window
     * @param {Function} [onRowClick]
     * @returns {HTMLElement}
     */
    static build(problemsByWindow, onRowClick) {
        const sorter = new ProblemSorter(SORT_FIELDS.FREQUENCY, 'desc');
        let activeTab = 0;

        const wrapper = H.create('div', { class: 'lc-unlock-table-wrap' });

        // ── Search Bar ──────────────────────────────────────────────────────────
        const searchInput = H.create('input', {
            class: 'lc-unlock-search',
            type: 'text',
            placeholder: 'Search problems…',
            id: 'lc-unlock-search-input',
        });

        // ── Tab Strip ────────────────────────────────────────────────────────────
        const tabStrip = TabGen.buildTabStrip(TIME_WINDOWS, activeTab, (idx) => {
            activeTab = idx;
            rebuildTable();
        });

        // ── Table ─────────────────────────────────────────────────────────────────
        const table = H.create('table', { class: 'lc-unlock-table' });

        const rebuildTable = () => {
            const query = searchInput.value.trim().toLowerCase();
            let problems = [...(problemsByWindow[activeTab] ?? [])];

            if (query) {
                problems = problems.filter(
                    (p) =>
                        p.name?.toLowerCase().includes(query) ||
                        String(p.id).includes(query)
                );
            }

            sorter.sort(problems);
            table.innerHTML = '';

            const thead = RowGen.buildHeader((col) => {
                if (sorter.field === col) sorter.toggleDir();
                else { sorter.field = col; sorter.dir = 'desc'; }
                rebuildTable();
            });

            const tbody = document.createElement('tbody');
            for (const prob of problems) {
                tbody.appendChild(RowGen.buildRow(prob, onRowClick));
            }

            table.appendChild(thead);
            table.appendChild(tbody);
        };

        searchInput.addEventListener('input', rebuildTable);
        rebuildTable();

        wrapper.appendChild(searchInput);
        wrapper.appendChild(tabStrip);
        wrapper.appendChild(table);
        return wrapper;
    }
}
