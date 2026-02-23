/**
 * TopProblemUnlocker
 * Activates on /study-plan/* pages.
 * Unlocks curated top-problem foldouts by removing locks and wiring click handlers.
 */

import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { TopProblemFoldoutElementModifier as FoldMod } from '../ElementModifier/TopProblemFoldoutElementModifier.js';
import { TableContentBuilder } from '../ContentBuilder/TableContentBuilder.js';
import { ContainerManager } from '../ContainerManager.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, URL_PATTERNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../Objects.js';
import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class TopProblemUnlocker {
    constructor() {
        this.modal = ContainerManager.getInstance();
        this.analytics = AnalyticsManager.getInstance();
    }

    static matches() {
        return URL_PATTERNS.STUDY_PLAN.test(window.location.href);
    }

    async init() {
        try {
            const settings = await this._getSettings();
            if (!settings.enableTopProblems) return;

            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.TOP_PROBLEMS);
            const problems = this._parseRows(rows);
            const slugMap = new Map(problems.map((p) => [p.slug, p]));

            FoldMod.removeLocks();
            FoldMod.injectUnlockedBadges();
            FoldMod.rewireLinks(({ slug, title }) => {
                const problem = slugMap.get(slug);
                if (!problem) return;
                this._openModal(problem);
            });

            // Watch for lazy-loaded sections
            H.observeDOM(() => {
                FoldMod.removeLocks();
                FoldMod.injectUnlockedBadges();
            });

            this.analytics.log('top_problem_unlocked', { url: window.location.href });
        } catch (err) {
            console.error('[LC-Unlock] TopProblemUnlocker error:', err);
        }
    }

    _openModal(problem) {
        this.modal.openLoading('Loading problem…');
        const content = TableContentBuilder.build([[problem], [problem], [problem], [problem]]);
        const title = H.create('h3', { class: 'lc-unlock-modal-title' }, problem.name);
        const wrap = H.create('div', {});
        wrap.appendChild(title);
        wrap.appendChild(content);
        this.modal.setContent(wrap);
        this.analytics.log('top_problem_click', { slug: problem.slug });
    }

    _parseRows(rows) {
        if (!rows?.length) return [];
        const [header, ...data] = rows;
        const idx = Object.fromEntries(header.map((h, i) => [h?.toLowerCase(), i]));
        return data.map((row) => ({
            id: Number(row[idx.id] ?? 0),
            name: row[idx.name] ?? '',
            slug: row[idx.slug] ?? '',
            difficulty: row[idx.difficulty] ?? '',
            acceptance: parseFloat(row[idx.acceptance] ?? 0),
            frequency: parseFloat(row[idx.frequency] ?? 0),
        }));
    }

    async _getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) => {
                resolve({ ...DEFAULT_SETTINGS, ...(r[STORAGE_KEYS.SETTINGS] ?? {}) });
            });
        });
    }
}
