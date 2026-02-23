/**
 * ProblemSorter
 * Strategy pattern — interchangeable sort algorithms for problem lists.
 * Sort field and direction are swappable at runtime.
 */

import { SORT_FIELDS, DIFFICULTY } from './Objects.js';

const DIFFICULTY_ORDER = {
    [DIFFICULTY.EASY]: 1,
    [DIFFICULTY.MEDIUM]: 2,
    [DIFFICULTY.HARD]: 3,
};

export class ProblemSorter {
    /**
     * @param {string} field     - One of SORT_FIELDS.*
     * @param {'asc'|'desc'} dir - Sort direction
     */
    constructor(field = SORT_FIELDS.FREQUENCY, dir = 'desc') {
        this.field = field;
        this.dir = dir;
    }

    /** Toggle sort direction. */
    toggleDir() {
        this.dir = this.dir === 'asc' ? 'desc' : 'asc';
    }

    /**
     * Sort an array of problem objects in-place.
     * @param {Object[]} problems
     * @returns {Object[]}
     */
    sort(problems) {
        const mult = this.dir === 'desc' ? -1 : 1;

        return problems.sort((a, b) => {
            let va, vb;
            switch (this.field) {
                case SORT_FIELDS.FREQUENCY:
                    va = a.frequency ?? 0;
                    vb = b.frequency ?? 0;
                    break;
                case SORT_FIELDS.DIFFICULTY:
                    va = DIFFICULTY_ORDER[a.difficulty] ?? 0;
                    vb = DIFFICULTY_ORDER[b.difficulty] ?? 0;
                    break;
                case SORT_FIELDS.NAME:
                    va = a.name?.toLowerCase() ?? '';
                    vb = b.name?.toLowerCase() ?? '';
                    break;
                case SORT_FIELDS.ID:
                    va = a.id ?? 0;
                    vb = b.id ?? 0;
                    break;
                case SORT_FIELDS.ACCEPTANCE:
                    va = a.acceptance ?? 0;
                    vb = b.acceptance ?? 0;
                    break;
                default:
                    return 0;
            }
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }
}
