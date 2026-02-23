/**
 * TopProblemFoldoutElementModifier
 * Patches the curated top-problem foldout sections in study plans.
 * Removes lock icons and rewires premium-gated items.
 */

import { ElementHelperClass as H } from '../ElementGenerator/ElementHelperClass.js';

export class TopProblemFoldoutElementModifier {
    /**
     * Remove lock icons and premium gates from all foldout items.
     */
    static removeLocks() {
        document.querySelectorAll(
            '[class*="study-plan"], [class*="study_plan"], [class*="top-problem"]'
        ).forEach((section) => {
            section.querySelectorAll('[class*="lock"], [class*="premium"]').forEach((el) =>
                el.remove()
            );
            section.querySelectorAll('[style*="blur"]').forEach((el) => {
                el.style.filter = 'none';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });
        });
    }

    /**
     * Rewire locked problem links in foldouts.
     * @param {Function} onLinkClick - called with { slug, title }
     */
    static rewireLinks(onLinkClick) {
        document.querySelectorAll(
            '[class*="study-plan"] a, [class*="top-problem"] a'
        ).forEach((link) => {
            if (!link.href.includes('/problems/')) return;
            const slug = link.href.match(/\/problems\/([^/]+)\//)?.[1];
            const title = link.textContent?.trim();
            if (!slug) return;

            link.setAttribute('href', 'javascript:void(0)');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onLinkClick({ slug, title });
            });
        });
    }

    /**
     * Inject a "Unlocked" badge next to each study-plan problem item.
     * @param {Element} [container=document]
     */
    static injectUnlockedBadges(container = document) {
        container.querySelectorAll('[class*="plan-item"], [class*="top-problem-item"]').forEach((item) => {
            if (item.querySelector('.lc-unlock-badge')) return;
            const badge = H.create('span', { class: 'lc-unlock-badge' }, '🔓');
            item.insertBefore(badge, item.firstChild);
        });
    }
}
