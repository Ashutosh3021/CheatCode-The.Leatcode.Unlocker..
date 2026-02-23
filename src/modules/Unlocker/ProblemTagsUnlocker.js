/**
 * ProblemTagsUnlocker
 * Activates on /problems/<slug>/ pages.
 * Replaces the premium company-tags section with real chip data from Sheets.
 */

import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { ProblemTagsElementModifier as TagsMod } from '../ElementModifier/ProblemTagsElementModifier.js';
import { TagsContentBuilder } from '../ContentBuilder/TagsContentBuilder.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, URL_PATTERNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../Objects.js';

export class ProblemTagsUnlocker {
    constructor() {
        this.analytics = AnalyticsManager.getInstance();
        this.slug = window.location.pathname.match(/\/problems\/([^/]+)\//)?.[1] ?? null;
    }

    static matches() {
        return URL_PATTERNS.PROBLEM_DETAIL.test(window.location.href);
    }

    async init() {
        if (!this.slug) return;

        try {
            const settings = await this._getSettings();
            if (!settings.enableCompanyTags) return;

            TagsMod.removePaywall();

            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.COMPANY_TAGS);
            const companiesByWindow = this._getCompaniesForProblem(rows, this.slug);

            const contentEl = TagsContentBuilder.build(companiesByWindow);
            TagsMod.inject(contentEl);

            this.analytics.log('tags_unlocked', { slug: this.slug });
        } catch (err) {
            console.error('[LC-Unlock] ProblemTagsUnlocker error:', err);
        }
    }

    /** Returns a 4-element array: [6m, 1yr, 2yr, all] of [{company, count}] */
    _getCompaniesForProblem(rows, slug) {
        if (!rows?.length) return [[], [], [], []];
        const [header, ...data] = rows;
        const idx = Object.fromEntries(header.map((h, i) => [h?.toLowerCase(), i]));

        const byWindow = [[], [], [], []];

        for (const row of data) {
            if (row[idx.slug] !== slug) continue;
            const windowIdx = Number(row[idx.window] ?? 3);
            const entry = {
                company: row[idx.company] ?? '',
                count: Number(row[idx.count] ?? 1),
            };
            byWindow[Math.min(windowIdx, 3)].push(entry);
        }

        return byWindow;
    }

    async _getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) => {
                resolve({ ...DEFAULT_SETTINGS, ...(r[STORAGE_KEYS.SETTINGS] ?? {}) });
            });
        });
    }
}
