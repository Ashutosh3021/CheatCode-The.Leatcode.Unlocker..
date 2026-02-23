---
description: Analyze the LeetCode Premium Bypass Chrome Extension — extract main idea, workflow, architecture, and improvement suggestions
---

# LeetCode Premium Bypass Extension — Analysis Workflow

## Main Idea

A Chrome/Firefox browser extension that injects JavaScript into every `https://leetcode.com/*` page and **patches the DOM** to show premium-locked content without a subscription.

- Fetches data (problem descriptions, company tags, editorials, frequency scores) from a **public Google Sheets spreadsheet**.
- Replaces premium-locked UI elements (blurred links, hidden frequency bars) with real data rendered in an in-page modal.
- No server-side hacking; purely client-side DOM manipulation.

---

## Architecture

```
manifest.json (Chrome Extension)
    └── main.js (Entry Point — Content Script)
            ├── ProblemTableUnlocker
            ├── CompaniesProblemUnlocker
            ├── EditorialUnlocker
            ├── ProblemTagsUnlocker
            └── TopProblemUnlocker
                    │
                    ├── DataFetcher (GoogleSheets / LocalStorage)
                    │       └── GoogleSheetBufferManager (LocalStorage Cache)
                    │               └── Google Sheets API (Public Spreadsheet)
                    │
                    ├── ElementModifier (DOM patching)
                    ├── ContentBuilder (UI assembly)
                    ├── ModalManager (in-page overlay)
                    └── FirebaseAnalyticsManager (disabled by default)
```

---

## Step-by-Step Workflow

### Step 1 — Injection
1. Chrome loads the extension on any `leetcode.com` page.
2. `manifest.json` injects `dist/main.js` and `dist/style.css` as content scripts.

### Step 2 — Page Detection & Unlocking
Each Unlocker activates based on the current URL/DOM:

| Unlocker | Page | Unlocks |
|---|---|---|
| `ProblemTableUnlocker` | `/problemset/all/` | Frequency bars + locked problem links |
| `CompaniesProblemUnlocker` | Problem list | Company-tagged problem lists |
| `EditorialUnlocker` | Problem detail | Editorial/solution content |
| `ProblemTagsUnlocker` | Problem detail | Company tags on a problem |
| `TopProblemUnlocker` | Study plans | Curated top-problem lists |

### Step 3 — Data Fetching (Layered Cache)

```
User Clicks Premium Content
        ↓
LocalStorage Cache hit? ──YES──→ Return cached data (TTL = 2 weeks)
        ↓ NO
GoogleSheetBufferManager fetches from Google Sheets API
        ↓
Data saved to chrome.storage.local
        ↓
Data returned to Unlocker
```

### Step 4 — DOM Manipulation
Each Unlocker uses an **ElementModifier** to:
1. Find target elements (problem rows, company buttons, editorial tabs).
2. Remove premium lock icons (`opacity: 0` or `.remove()`).
3. Rewrite `href` to `javascript:void(0)` and attach click event listeners.
4. Inject green frequency progress bars into problem rows.

### Step 5 — Modal Rendering
When a user clicks a locked item:
1. `ModalManager` opens a full-page overlay modal.
2. Loading spinner is shown while data is fetched.
3. HTML content is **sanitized with DOMPurify** before injection.
4. `ContentBuilder` assembles the UI (sortable tables with 6mo/1yr/2yr/all-time tabs).
5. Modal closes when user clicks outside.

### Step 6 — Analytics
`FirebaseAnalyticsManager` logs anonymized usage events to GA4 — **disabled by default** (`enableAnalytics = false`).

---

## Improvement Suggestions

### 🔴 Critical
1. **Hard-coded API Key** (`GoogleSheetsDataFetcher.js`) — visible in extension source.
   - **Fix**: Use a Cloudflare Worker proxy to hide the key.
2. **`isFetching` flag not reset on error** — user gets permanently stuck.
   - **Fix**: Use `finally` blocks to always reset `isFetching`.

### 🟡 Performance
3. **Per-row Google Sheets fetch** for problem descriptions — slow.
   - **Fix**: Batch pre-fetch all rows; cache in background service worker.
4. **Company data not persisted** across sessions.
   - **Fix**: Cache company data in `chrome.storage.local` with 24h TTL.

### 🟢 Features
5. **Popup UI is near-empty** — add settings toggles + manual refresh button + last-fetch time.
6. **No search/filter** in company problem modal — add a live search input.
7. **No syntax highlighting** in code blocks — add Prism.js for `<pre>` blocks.
8. **`TagPageProblemTableUnlocker` is a stub** (130 bytes) — complete or remove.
9. **Hardcoded hex colors** — use LeetCode's own CSS custom properties for better dark/light mode support.
10. **Firefox compatibility** — add `webextension-polyfill` for full cross-browser support.

---

## Key Design Patterns Used

| Pattern | Where |
|---|---|
| Singleton | `ModalManager`, `FirebaseAnalyticsManager` |
| Strategy | Sorters (`Frequency`, `Difficulty`, `Name`, `ID`, `Acceptance`) |
| Observer / Event Injection | ElementModifiers inject handlers onto DOM elements |
| Cache-Aside | `GoogleSheetBufferManager` — local check → miss → fetch → store |
