/**
 * background.js — Manifest v3 Service Worker
 * Handles extension install/update events and message passing.
 * Runs in the background, separate from page content scripts.
 */

import browser from 'webextension-polyfill';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from './modules/Objects.js';

// ─── Install / Update ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
        // Write default settings on first install
        await chrome.storage.local.set({
            [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
        });
        console.info('[LC-Unlock] Extension installed. Default settings written.');
    }

    if (reason === 'update') {
        // Merge new defaults without overwriting user prefs
        const existing = await new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) =>
                resolve(r[STORAGE_KEYS.SETTINGS] ?? {})
            );
        });
        await chrome.storage.local.set({
            [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS, ...existing },
        });
        console.info('[LC-Unlock] Extension updated. Settings merged.');
    }
});

// ─── Message Handling ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'GET_SETTINGS':
            chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (r) => {
                sendResponse({ settings: { ...DEFAULT_SETTINGS, ...(r[STORAGE_KEYS.SETTINGS] ?? {}) } });
            });
            return true; // async response

        case 'SAVE_SETTINGS':
            chrome.storage.local.set(
                { [STORAGE_KEYS.SETTINGS]: message.settings },
                () => sendResponse({ ok: true })
            );
            return true;

        case 'CLEAR_CACHE':
            chrome.storage.local.clear(() => {
                // Re-write settings after clearing
                chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
                sendResponse({ ok: true });
            });
            return true;

        case 'GET_CACHE_AGE': {
            const keys = Object.values(STORAGE_KEYS);
            chrome.storage.local.get(keys, (r) => {
                const ages = {};
                for (const key of keys) {
                    const entry = r[key];
                    ages[key] = entry?.timestamp
                        ? Math.floor((Date.now() - entry.timestamp) / 1000)
                        : null;
                }
                sendResponse({ ages });
            });
            return true;
        }

        default:
            break;
    }
});
