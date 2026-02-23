/**
 * CompaniesProblemUnlocker
 * Activates on /company/* pages and the company tag swiper widget.
 * Fetches company problem lists and injects them into the UI.
 * 🟡 Fix: Company data cached with 24h TTL (defined in GoogleSheetsDataGrabber).
 */

import { GoogleSheetsDataGrabber } from '../DataFetcher/GoogleSheetsDataGrabber.js';
import { CompanySwipperElementModifier as SwipeMod } from '../ElementModifier/CompanySwipperElementModifier.js';
import { TableContentBuilder } from '../ContentBuilder/TableContentBuilder.js';
import { ContainerManager } from '../ContainerManager.js';
import { AnalyticsManager } from '../AnalyticsManager.js';
import { SHEETS, URL_PATTERNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../Objects.js';
import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class CompaniesProblemUnlocker {
    constructor() {
        this.modal = ContainerManager.getInstance();
        this.analytics = AnalyticsManager.getInstance();
    }

    static matches() {
        return (
            URL_PATTERNS.COMPANY.test(window.location.href) ||
            document.querySelector('[class*="company-tags"], [class*="companyTags"]') !== null
        );
    }

    async init() {
        try {
            const rows = await GoogleSheetsDataGrabber.getData(SHEETS.COMPANY_TAGS);
            const companyMap = this._parseRows(rows); // Map<company, {byWindow: Problem[][]}>

            // Patch swiper cards
            const countMap = new Map(
                [...companyMap.entries()].map(([c, d]) => [c, d.byWindow[3]?.length ?? 0])
            );
            SwipeMod.removeLocks();
            SwipeMod.injectCounts(countMap);

            // Wire each company card to open a modal
            document.querySelectorAll('[class*="company-card"], [class*="companyCard"]').forEach((card) => {
                const nameEl = card.querySelector('[class*="name"], [class*="title"]');
                const company = nameEl?.textContent?.trim();
                if (!company || !companyMap.has(company)) return;

                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const data = companyMap.get(company);
                    this._openModal(company, data.byWindow);
                });
            });
        } catch (err) {
            console.error('[LC-Unlock] CompaniesProblemUnlocker error:', err);
        }
    }

    _openModal(company, problemsByWindow) {
        this.modal.openLoading(`Loading ${company} problems…`);
        this.analytics.log('company_click', { company });
        const content = TableContentBuilder.build(problemsByWindow);

        const title = H.create('h3', { class: 'lc-unlock-modal-title' }, `${company} — Problems`);
        const wrap = H.create('div', {});
        wrap.appendChild(title);
        wrap.appendChild(content);
        this.modal.setContent(wrap);
    }

    /** Parse rows into Map<company, { byWindow: Problem[][] }> */
    _parseRows(rows) {
        if (!rows?.length) return new Map();
        const [header, ...data] = rows;
        const idx = Object.fromEntries(header.map((h, i) => [h?.toLowerCase(), i]));
        const map = new Map();

        for (const row of data) {
            const company = row[idx.company] ?? '';
            const windowIdx = Number(row[idx.window] ?? 3); // 0=6m,1=1yr,2=2yr,3=all
            const problem = {
                id: Number(row[idx.id] ?? 0),
                name: row[idx.name] ?? '',
                slug: row[idx.slug] ?? '',
                difficulty: row[idx.difficulty] ?? '',
                acceptance: parseFloat(row[idx.acceptance] ?? 0),
                frequency: parseFloat(row[idx.frequency] ?? 0),
            };

            if (!map.has(company)) map.set(company, { byWindow: [[], [], [], []] });
            map.get(company).byWindow[windowIdx]?.push(problem);
        }

        return map;
    }
}
