/**
 * main.js — Content Script Entry Point
 * Detects the current LeetCode page and initialises the matching Unlocker(s).
 * Loaded on every https://leetcode.com/* page via manifest.json.
 */

import 'webextension-polyfill';
import './style.css';

import { ProblemTableUnlocker } from './modules/Unlocker/ProblemTableUnlocker.js';
import { CompaniesProblemUnlocker } from './modules/Unlocker/CompaniesProblemUnlocker.js';
import { EditorialUnlocker } from './modules/Unlocker/EditorialUnlocker.js';
import { ProblemTagsUnlocker } from './modules/Unlocker/ProblemTagsUnlocker.js';
import { TagPageProblemTableUnlocker } from './modules/Unlocker/TagPageProblemTableUnlocker.js';
import { TopProblemUnlocker } from './modules/Unlocker/TopProblemUnlocker.js';
import { AnalyticsManager } from './modules/AnalyticsManager.js';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from './modules/Objects.js';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
    // Load user settings
    const settings = await getSettings();

    // Enable analytics if opted in
    if (settings.enableAnalytics) {
        AnalyticsManager.getInstance().setEnabled(true);
    }

    // All registered unlockers — each self-selects via .matches()
    const unlockers = [
        new ProblemTableUnlocker(),
        new CompaniesProblemUnlocker(),
        new EditorialUnlocker(),
        new ProblemTagsUnlocker(),
        new TagPageProblemTableUnlocker(),
        new TopProblemUnlocker(),
    ];

    // Check static class .matches() to determine which are relevant for this page
    const matched = unlockers.filter((u) => u.constructor.matches());

    if (matched.length === 0) return;

    console.info(
        `[LC-Unlock] Page matched ${matched.length} unlocker(s):`,
        matched.map((u) => u.constructor.name)
    );

    // Run all matched unlockers (they handle their own errors internally)
    await Promise.allSettled(matched.map((u) => u.init()));
}

function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) => {
            resolve({ ...DEFAULT_SETTINGS, ...(r[STORAGE_KEYS.SETTINGS] ?? {}) });
        });
    });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

// Re-boot on LeetCode's SPA navigation (pushState/replaceState)
let lastUrl = location.href;
if (document.body) {
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(bootstrap, 500);
        }
    }).observe(document.body, { subtree: true, childList: true });
}
