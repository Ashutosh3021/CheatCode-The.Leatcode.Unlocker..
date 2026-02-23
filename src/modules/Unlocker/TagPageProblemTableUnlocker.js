/**
 * TagPageProblemTableUnlocker
 * Activates on /tag/* pages.
 * Injects frequency bars and removes locks from tag-filtered problem tables.
 * 🟢 Fix: Full implementation replacing the original 130-byte stub.
 */

import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { TagPageProblemTableElementModifier as TagMod } from '../ElementModifier/TagPageProblemTableElementModifier.js';
import { TableContentBuilder } from '../ContentBuilder/TableContentBuilder.js';
import { ContainerManager } from '../ContainerManager.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, URL_PATTERNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../Objects.js';
import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class TagPageProblemTableUnlocker {
    constructor() {
        this.modal = ContainerManager.getInstance();
        this.analytics = AnalyticsManager.getInstance();
    }

    static matches() {
        return URL_PATTERNS.TAG.test(window.location.href);
    }

    async init() {
        try {
            const settings = await this._getSettings();
            if (!settings.enableFrequencyBars) return;

            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.PROBLEM_DATA);
            const problems = this._parseRows(rows);
            const slugFreqMap = new Map(problems.map((p) => [p.slug, p.frequency ?? 0]));
            const slugProbMap = new Map(problems.map((p) => [p.slug, p]));

            TagMod.removeLocks();
            TagMod.injectFrequencyBars(slugFreqMap);
            TagMod.rewireLockedLinks((slug) => {
                const problem = slugProbMap.get(slug);
                if (!problem) return;
                this._openModal(problem);
            });

            H.observeDOM(() => {
                TagMod.removeLocks();
                TagMod.injectFrequencyBars(slugFreqMap);
            });

            this.analytics.log('tag_page_unlocked', { url: window.location.href });
        } catch (err) {
            console.error('[LC-Unlock] TagPageProblemTableUnlocker error:', err);
        }
    }

    _openModal(problem) {
        this.modal.openLoading('Loading problem…');
        const content = TableContentBuilder.build([[problem], [problem], [problem], [problem]]);
        this.modal.setContent(content);
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
