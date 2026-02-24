/**
 * Objects.js — Shared constants, data models, and config used across all modules.
 */

// ─── Google Sheets Proxy Config ───────────────────────────────────────────────
// 🔴 Fix: API key is NEVER in extension source — route all requests through a Cloudflare Worker.
export const SHEETS_CONFIG = {
    PROXY_URL: 'https://lc-sheets-proxy.cheatcode23.workers.dev/sheets', // Replace with your Cloudflare Worker URL
    SPREADSHEET_ID: '17uIfHiWPFoHVnpy3Ps9KBccr5DG2Y3ZIUC9zODlg1Jo', // Your public Google Sheet
};

// ─── Sheet Tab Names ──────────────────────────────────────────────────────────
export const SHEETS = {
    PROBLEM_DATA: 'problems',
    COMPANY_TAGS: 'companies',
    EDITORIALS: 'editorial',
    TOP_PROBLEMS: 'top',
};

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
export const TTL = {
    TWO_WEEKS: 14 * 24 * 60 * 60 * 1000,
    ONE_DAY: 1 * 24 * 60 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
    PROBLEM_DATA: 'lc_unlock_problems',
    COMPANY_DATA: 'lc_unlock_companies',
    EDITORIAL: 'lc_unlock_editorial',
    TOP_PROBLEMS: 'lc_unlock_top',
    SETTINGS: 'lc_unlock_settings',
    LAST_FETCH: 'lc_unlock_last_fetch',
};

// ─── Default Settings ────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
    enableFrequencyBars: true,
    enableCompanyTags: true,
    enableEditorials: true,
    enableTopProblems: true,
    enableAnalytics: false,
};

// ─── Difficulty ───────────────────────────────────────────────────────────────
export const DIFFICULTY = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };

// ─── Sort Fields ─────────────────────────────────────────────────────────────
export const SORT_FIELDS = {
    FREQUENCY: 'frequency',
    DIFFICULTY: 'difficulty',
    NAME: 'name',
    ID: 'id',
    ACCEPTANCE: 'acceptance',
};

// ─── Time Windows ─────────────────────────────────────────────────────────────
export const TIME_WINDOWS = ['6 Months', '1 Year', '2 Years', 'All Time'];

// ─── URL Patterns ────────────────────────────────────────────────────────────
export const URL_PATTERNS = {
    PROBLEM_SET: /leetcode\.com\/problemset\//,
    PROBLEM_DETAIL: /leetcode\.com\/problems\/[^/]+\//,
    COMPANY: /leetcode\.com\/company\//,
    TAG: /leetcode\.com\/tag\//,
    STUDY_PLAN: /leetcode\.com\/study-plan\//,
};
