/**
 * extensionPopupManager.js
 * Controls the extension popup UI:
 * - Settings toggles (frequency bars, company tags, editorials, top problems, analytics)
 * - Manual cache refresh button
 * - Last-fetch timestamp per data type
 * 🟢 Feature: Full settings UI (was previously near-empty).
 */

import 'webextension-polyfill';
import './extensionPopup.css';

const LABEL_MAP = {
    enableFrequencyBars: 'Frequency Bars',
    enableCompanyTags: 'Company Tags',
    enableEditorials: 'Editorials',
    enableTopProblems: 'Top Problems',
    enableAnalytics: 'Anonymous Analytics',
};

let currentSettings = {};

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadCacheAge();
    renderToggles();
    bindRefreshButton();
});

// ─── Settings ─────────────────────────────────────────────────────────────────

async function loadSettings() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
            currentSettings = res?.settings ?? {};
            resolve();
        });
    });
}

async function saveSettings() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: currentSettings }, resolve);
    });
}

function renderToggles() {
    const container = document.getElementById('toggles-container');
    if (!container) return;
    container.innerHTML = '';

    for (const [key, label] of Object.entries(LABEL_MAP)) {
        const row = document.createElement('label');
        row.className = 'toggle-row';

        const span = document.createElement('span');
        span.textContent = label;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `toggle-${key}`;
        input.checked = !!currentSettings[key];
        input.addEventListener('change', async () => {
            currentSettings[key] = input.checked;
            await saveSettings();
        });

        const pill = document.createElement('span');
        pill.className = 'toggle-pill';

        row.appendChild(span);
        row.appendChild(input);
        row.appendChild(pill);
        container.appendChild(row);
    }
}

// ─── Cache Age ────────────────────────────────────────────────────────────────

async function loadCacheAge() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_CACHE_AGE' }, (res) => {
            const ages = res?.ages ?? {};
            const el = document.getElementById('cache-info');
            if (!el) return resolve();

            const lines = Object.entries(ages)
                .filter(([, age]) => age !== null)
                .map(([key, age]) => {
                    const mins = Math.floor(age / 60);
                    const hrs = Math.floor(mins / 60);
                    const time = hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : 'just now';
                    return `<span class="cache-key">${key.replace('lc_unlock_', '')}</span>: ${time}`;
                });

            el.innerHTML = lines.length
                ? lines.join('<br>')
                : '<em>No cached data yet.</em>';

            resolve();
        });
    });
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

function bindRefreshButton() {
    const btn = document.getElementById('btn-refresh');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Clearing…';
        await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, resolve);
        });
        btn.textContent = '✓ Cache cleared!';
        await loadCacheAge();
        setTimeout(() => {
            btn.textContent = 'Refresh Cache';
            btn.disabled = false;
        }, 2000);
    });
}
