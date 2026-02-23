/**
 * EditorialUnlocker
 * Activates on /problems/<slug>/ pages.
 * Replaces the premium editorial paywall with real editorial content from Sheets.
 */

import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { EditorialPageElementModifier as EditMod } from '../ElementModifier/EditorialPageElementModifier.js';
import { EditorialContentBuilder } from '../ContentBuilder/EditorialContentBuilder.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, URL_PATTERNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../Objects.js';

export class EditorialUnlocker {
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
            if (!settings.enableEditorials) return;

            // Inject unlock prompt immediately, before data loads
            EditMod.injectUnlockPrompt(() => this._loadAndShow());
        } catch (err) {
            console.error('[LC-Unlock] EditorialUnlocker error:', err);
        }
    }

    async _loadAndShow() {
        try {
            this.analytics.log('editorial_click', { slug: this.slug });

            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.EDITORIALS);
            const editorial = this._findEditorial(rows, this.slug);

            if (!editorial) {
                EditMod.showContent(
                    Object.assign(document.createElement('p'), {
                        textContent: 'Editorial not available for this problem.',
                        className: 'lc-unlock-empty',
                    })
                );
                return;
            }

            const contentEl = EditorialContentBuilder.build(editorial);
            EditMod.showContent(contentEl);
        } catch (err) {
            console.error('[LC-Unlock] EditorialUnlocker load error:', err);
        }
    }

    _findEditorial(rows, slug) {
        if (!rows?.length) return null;
        const [header, ...data] = rows;
        const idx = Object.fromEntries(header.map((h, i) => [h?.toLowerCase(), i]));

        const row = data.find((r) => r[idx.slug] === slug);
        if (!row) return null;

        return {
            title: row[idx.title] ?? slug,
            content: row[idx.content] ?? '',
            difficulty: row[idx.difficulty] ?? '',
            slug,
        };
    }

    async _getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) => {
                resolve({ ...DEFAULT_SETTINGS, ...(r[STORAGE_KEYS.SETTINGS] ?? {}) });
            });
        });
    }
}
