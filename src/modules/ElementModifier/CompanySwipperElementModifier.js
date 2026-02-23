/**
 * CompanySwipperElementModifier
 * Patches the company swiper/carousel widget that appears on some LeetCode pages.
 * Removes locked overlays and injects real company data links.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class CompanySwipperElementModifier {
    /**
     * Remove lock overlays from every company card in the swiper.
     */
    static removeLocks() {
        document.querySelectorAll(
            '[class*="company-card"], [class*="companyCard"], [class*="swiper-slide"]'
        ).forEach((card) => {
            card.querySelectorAll('[class*="lock"], [class*="premium"]').forEach((el) =>
                el.remove()
            );
            card.style.filter = 'none';
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        });
    }

    /**
     * Inject count badges into company cards.
     * @param {Map<string, number>} companyCountMap - company name → count
     */
    static injectCounts(companyCountMap) {
        document.querySelectorAll(
            '[class*="company-card"], [class*="companyCard"]'
        ).forEach((card) => {
            const nameEl = card.querySelector('[class*="name"], [class*="title"]');
            if (!nameEl) return;

            const company = nameEl.textContent?.trim();
            const count = companyCountMap.get(company);
            if (count == null) return;

            const existing = card.querySelector('.lc-unlock-count-badge');
            if (existing) { existing.textContent = count; return; }

            const badge = H.create('span', {
                class: 'lc-unlock-count-badge',
            }, String(count));
            card.appendChild(badge);
        });
    }
}
