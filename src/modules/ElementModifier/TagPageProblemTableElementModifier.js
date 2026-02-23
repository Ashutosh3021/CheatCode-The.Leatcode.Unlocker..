/**
 * TagPageProblemTableElementModifier
 * Patches the problem table on tag-filtered pages (e.g. /tag/array/).
 * Previously a stub — now fully implemented.
 * 🟢 Fix: Complete implementation (was 130-byte stub).
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class TagPageProblemTableElementModifier {
    /**
     * Remove premium lock overlays from all rows in the tag page table.
     */
    static removeLocks() {
        document.querySelectorAll(
            'table tr, [class*="problem-row"], [class*="problemRow"]'
        ).forEach((row) => {
            row.querySelectorAll('[class*="lock"], [class*="premium"]').forEach((el) =>
                el.remove()
            );
            row.querySelectorAll('[style*="blur"]').forEach((el) => {
                el.style.filter = 'none';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });
        });
    }

    /**
     * Inject frequency bars into the tag-page problem table rows.
     * @param {Map<string, number>} slugFreqMap - slug → frequency score
     */
    static injectFrequencyBars(slugFreqMap) {
        document.querySelectorAll(
            'table tr[data-slug], [class*="problem-row"][data-slug]'
        ).forEach((row) => {
            const slug = row.dataset.slug;
            const freq = slugFreqMap.get(slug);
            if (freq == null) return;

            const existing = row.querySelector('.lc-unlock-freq-bar-wrap');
            if (existing) return;

            const bar = H.create('div', { class: 'lc-unlock-freq-bar-wrap' },
                H.create('div', {
                    class: 'lc-unlock-freq-bar-fill',
                    style: { width: `${Math.min(100, Math.round(freq))}%` },
                })
            );

            const lastCell = row.querySelector('td:last-child');
            if (lastCell) lastCell.appendChild(bar);
        });
    }

    /**
     * Rewire locked links in tag-page rows.
     * @param {Function} onLinkClick - called with slug string
     */
    static rewireLockedLinks(onLinkClick) {
        document.querySelectorAll(
            'table tr a[href*="premium"], [class*="problem-row"] a[href*="premium"]'
        ).forEach((link) => {
            const slug = link.href.match(/\/problems\/([^/]+)\//)?.[1];
            if (!slug) return;

            link.setAttribute('href', 'javascript:void(0)');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onLinkClick(slug);
            });
        });
    }
}
