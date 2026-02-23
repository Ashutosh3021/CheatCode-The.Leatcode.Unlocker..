/**
 * ProblemTableUnlocker
 * Activates on /problemset/ pages.
 * Batch-fetches all problem data, injects frequency bars, removes locks.
 */


import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { ProblemTableElementModifier as Modifier } from '../ElementModifier/ProblemTableElementModifier.js';
import { TableContentBuilder } from '../ContentBuilder/TableContentBuilder.js';
import { ContainerManager } from '../ContainerManager.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, DEFAULT_SETTINGS, STORAGE_KEYS, URL_PATTERNS } from '../Objects.js';
import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class ProblemTableUnlocker {
    constructor() {
        this.modal = ContainerManager.getInstance();
        this.analytics = AnalyticsManager.getInstance();
        this.problems = null; // cached parsed problems
    }

    /** Check if this page should be unlocked. */
    static matches() {
        return URL_PATTERNS.PROBLEM_SET.test(window.location.href);
    }

    /** Entry point — called from main.js */
    async init() {
        try {
            const settings = await this._getSettings();
            if (!settings.enableFrequencyBars) return;

            // 🟡 Batch-fetch all problems at once
            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.PROBLEM_DATA);
            this.problems = this._parseRows(rows);

            // Build a slug→problem map for fast lookup
            this.slugMap = new Map(this.problems.map((p) => [p.slug, p]));

            // Patch existing rows then watch for new ones (virtual scroll)
            this._patchAllRows();
            H.observeDOM(() => this._patchAllRows());
        } catch (err) {
            console.error('[LC-Unlock] ProblemTableUnlocker error:', err);
        }
    }

    _patchAllRows() {
        document.querySelectorAll('tr, [class*="problem-row"]').forEach((row) => {
            if (row.dataset.lcUnlocked) return;
            const link = row.querySelector('a[href*="/problems/"]');
            if (!link) return;

            const slug = link.href.match(/\/problems\/([^/]+)\//)?.[1];
            if (!slug || !this.slugMap.has(slug)) return;

            const problem = this.slugMap.get(slug);
            Modifier.removeLock(row);
            Modifier.injectFrequencyBar(row, problem.frequency ?? 0);
            Modifier.rewireLink(link, () => this._openModal(problem));

            row.dataset.lcUnlocked = '1';
        });
    }

    _openModal(problem) {
        this.modal.openLoading('Loading problem data…');
        this.analytics.log('problem_table_click', { slug: problem.slug });

        // Group into time windows (all same for table-level data)
        const byWindow = [
            problem.companiesByWindow?.[0] ?? [],
            problem.companiesByWindow?.[1] ?? [],
            problem.companiesByWindow?.[2] ?? [],
            problem.companiesByWindow?.[3] ?? [],
        ];
        const content = TableContentBuilder.build([
            [problem], [problem], [problem], [problem]
        ]);
        this.modal.setContent(content);
    }

    /** Parse raw Sheets rows into problem objects. */
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
            tags: (row[idx.tags] ?? '').split(',').map((s) => s.trim()),
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
