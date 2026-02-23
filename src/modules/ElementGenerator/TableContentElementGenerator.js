/**
 * TableContentElementGenerator
 * Generates individual HTML table row elements for the problem list table.
 * Each row represents one LeetCode problem with frequency, difficulty, etc.
 * 🟢 Fix: Uses LeetCode CSS custom properties instead of hard-coded hex colors.
 */

import { ElementHelperClass as H } from './ElementHelperClass.js';
import { DIFFICULTY } from '../Objects.js';

const DIFFICULTY_COLOR = {
    [DIFFICULTY.EASY]: 'var(--lc-difficulty-easy,   #00b8a3)',
    [DIFFICULTY.MEDIUM]: 'var(--lc-difficulty-medium, #ffc01e)',
    [DIFFICULTY.HARD]: 'var(--lc-difficulty-hard,   #ef4743)',
};

export class TableContentElementGenerator {
    /**
     * Build a <tr> element for one problem.
     * @param {Object} problem
     * @param {number} problem.id
     * @param {string} problem.name
     * @param {string} problem.slug
     * @param {string} problem.difficulty
     * @param {number} problem.acceptance
     * @param {number} problem.frequency  - 0-100 normalized score
     * @param {Function} onRowClick       - called with problem on click
     * @returns {HTMLTableRowElement}
     */
    static buildRow(problem, onRowClick) {
        const { id, name, slug, difficulty, acceptance, frequency } = problem;

        const freqBar = H.create('div', { class: 'lc-unlock-freq-bar-wrap' },
            H.create('div', {
                class: 'lc-unlock-freq-bar-fill',
                style: { width: `${Math.round(frequency)}%` },
            })
        );

        const diffBadge = H.create('span', {
            class: 'lc-unlock-difficulty',
            style: { color: DIFFICULTY_COLOR[difficulty] ?? 'inherit' },
        }, difficulty);

        const nameCell = H.create('a', {
            class: 'lc-unlock-prob-name',
            href: `https://leetcode.com/problems/${slug}/`,
            target: '_blank',
        }, `${id}. ${name}`);

        const tr = H.create('tr', { class: 'lc-unlock-prob-row', 'data-slug': slug },
            H.create('td', {}, String(id)),
            H.create('td', {}, nameCell),
            H.create('td', {}, diffBadge),
            H.create('td', {}, `${acceptance}%`),
            H.create('td', {}, freqBar),
        );

        if (typeof onRowClick === 'function') {
            tr.addEventListener('click', () => onRowClick(problem));
        }

        return tr;
    }

    /**
     * Build the <thead> for the problem table.
     * @param {Function} onSort - called with column key when header clicked
     * @returns {HTMLTableSectionElement}
     */
    static buildHeader(onSort) {
        const cols = [
            { label: '#', key: 'id' },
            { label: 'Title', key: 'name' },
            { label: 'Difficulty', key: 'difficulty' },
            { label: 'Acceptance', key: 'acceptance' },
            { label: 'Frequency', key: 'frequency' },
        ];

        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        for (const { label, key } of cols) {
            const th = H.create('th', {
                class: 'lc-unlock-th',
                'data-sort': key,
            }, label);
            if (typeof onSort === 'function') {
                th.addEventListener('click', () => onSort(key));
            }
            tr.appendChild(th);
        }

        thead.appendChild(tr);
        return thead;
    }
}
