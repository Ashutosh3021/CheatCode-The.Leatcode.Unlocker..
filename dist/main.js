/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 680
(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {


// EXTERNAL MODULE: ./node_modules/webextension-polyfill/dist/browser-polyfill.js
var browser_polyfill = __webpack_require__(815);
;// ./src/modules/Objects.js
/**
 * Objects.js — Shared constants, data models, and config used across all modules.
 */

// ─── Google Sheets Proxy Config ───────────────────────────────────────────────
// 🔴 Fix: API key is NEVER in extension source — route all requests through a Cloudflare Worker.
const SHEETS_CONFIG = {
  PROXY_URL: 'https://lc-sheets-proxy.cheatcode23.workers.dev/sheets',
  // Replace with your Cloudflare Worker URL
  SPREADSHEET_ID: '17uIfHiWPFoHVnpy3Ps9KBccr5DG2Y3ZIUC9zODlg1Jo' // Your public Google Sheet
};

// ─── Sheet Tab Names ──────────────────────────────────────────────────────────
const SHEETS = {
  PROBLEM_DATA: 'problems',
  COMPANY_TAGS: 'companies',
  EDITORIALS: 'editorial',
  TOP_PROBLEMS: 'top'
};

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const TTL = {
  TWO_WEEKS: 14 * 24 * 60 * 60 * 1000,
  ONE_DAY: 1 * 24 * 60 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000
};

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  PROBLEM_DATA: 'lc_unlock_problems',
  COMPANY_DATA: 'lc_unlock_companies',
  EDITORIAL: 'lc_unlock_editorial',
  TOP_PROBLEMS: 'lc_unlock_top',
  SETTINGS: 'lc_unlock_settings',
  LAST_FETCH: 'lc_unlock_last_fetch'
};

// ─── Default Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  enableFrequencyBars: true,
  enableCompanyTags: true,
  enableEditorials: true,
  enableTopProblems: true,
  enableAnalytics: false
};

// ─── Difficulty ───────────────────────────────────────────────────────────────
const DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

// ─── Sort Fields ─────────────────────────────────────────────────────────────
const SORT_FIELDS = {
  FREQUENCY: 'frequency',
  DIFFICULTY: 'difficulty',
  NAME: 'name',
  ID: 'id',
  ACCEPTANCE: 'acceptance'
};

// ─── Time Windows ─────────────────────────────────────────────────────────────
const TIME_WINDOWS = ['6 Months', '1 Year', '2 Years', 'All Time'];

// ─── URL Patterns ────────────────────────────────────────────────────────────
const URL_PATTERNS = {
  PROBLEM_SET: /leetcode\.com\/problemset\//,
  PROBLEM_DETAIL: /leetcode\.com\/problems\/[^/]+\//,
  COMPANY: /leetcode\.com\/company\//,
  TAG: /leetcode\.com\/tag\//,
  STUDY_PLAN: /leetcode\.com\/study-plan\//
};
;// ./src/modules/DataFetcher/GoogleSheetsDataFetcher.js
/**
 * GoogleSheetsDataFetcher
 * Fetches rows from Google Sheets via a Cloudflare Worker proxy.
 *
 * 🔴 Fix: No API key in extension source — proxy handles auth.
 * 🔴 Fix: isFetching is ALWAYS reset in a finally block.
 * 🟡 Fix: fetchAll() batch-fetches all rows in one request (no per-row calls).
 */


class GoogleSheetsDataFetcher {
  constructor() {
    this.isFetching = false;
  }

  /**
   * Fetch a named range via the proxy.
   * @param {string} sheetName - Tab name in the spreadsheet
   * @param {string} [range]   - Optional A1 range notation
   * @returns {Promise<any[][]>} 2D array of row values
   */
  async fetchRange(sheetName, range = '') {
    if (this.isFetching) {
      console.warn('[LC-Unlock] Fetch in progress, request dropped.');
      return null;
    }
    this.isFetching = true;
    try {
      const rangeParam = range ? `${sheetName}!${range}` : sheetName;
      const url = new URL(SHEETS_CONFIG.PROXY_URL);
      url.searchParams.set('spreadsheetId', SHEETS_CONFIG.SPREADSHEET_ID);
      url.searchParams.set('range', rangeParam);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Proxy error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.values ?? [];
    } catch (err) {
      console.error('[LC-Unlock] GoogleSheetsDataFetcher:', err);
      throw err;
    } finally {
      this.isFetching = false; // 🔴 Always reset
    }
  }

  /**
   * Batch-fetch ALL rows from a sheet tab in one request.
   * 🟡 Performance fix: avoids per-row API calls.
   * @param {string} sheetName
   * @returns {Promise<any[][]>}
   */
  async fetchAll(sheetName) {
    return this.fetchRange(sheetName);
  }
}
;// ./src/modules/BufferManager/GoogleSheetsBufferManager.js
/**
 * GoogleSheetsBufferManager
 * Cache-Aside pattern — wraps chrome.storage.local with a configurable TTL.
 * Default TTL: 2 weeks. Company data uses 24h TTL.
 * 🟡 Fix: Company data is now persisted across sessions with shorter TTL.
 */

class GoogleSheetsBufferManager {
  /**
   * @param {string} storageKey - Unique key in chrome.storage.local
   * @param {number} ttl        - TTL in milliseconds
   */
  constructor(storageKey, ttl) {
    this.storageKey = storageKey;
    this.ttl = ttl;
  }

  /** Read from cache. Returns null if absent or expired. */
  async get() {
    return new Promise(resolve => {
      chrome.storage.local.get([this.storageKey], result => {
        const entry = result[this.storageKey];
        if (!entry) return resolve(null);
        const {
          data,
          timestamp
        } = entry;
        if (Date.now() - timestamp > this.ttl) {
          chrome.storage.local.remove(this.storageKey);
          return resolve(null);
        }
        resolve(data);
      });
    });
  }

  /** Write data to cache with current timestamp. */
  async set(data) {
    return new Promise(resolve => {
      chrome.storage.local.set({
        [this.storageKey]: {
          data,
          timestamp: Date.now()
        }
      }, resolve);
    });
  }

  /** Invalidate the cache entry. */
  async clear() {
    return new Promise(resolve => {
      chrome.storage.local.remove(this.storageKey, resolve);
    });
  }

  /** Returns true if a valid (non-expired) cache entry exists. */
  async has() {
    const data = await this.get();
    return data !== null;
  }

  /** Returns seconds since the last successful cache write, or null. */
  async getAge() {
    return new Promise(resolve => {
      chrome.storage.local.get([this.storageKey], result => {
        const entry = result[this.storageKey];
        if (!entry) return resolve(null);
        resolve(Math.floor((Date.now() - entry.timestamp) / 1000));
      });
    });
  }
}
;// ./src/modules/DataFetcher/GoogleSheetsDataGrabber.js
/**
 * GoogleSheetsDataGrabber
 * High-level orchestrator: checks buffer first, fetches from Sheets on miss.
 * Wraps GoogleSheetsDataFetcher + GoogleSheetsBufferManager.
 *
 * 🟡 Fix: Company data persisted with 24h TTL (was lost between sessions).
 */




const fetcher = new GoogleSheetsDataFetcher();

// Each data type gets its own buffer with appropriate TTL
const buffers = {
  [SHEETS.PROBLEM_DATA]: new GoogleSheetsBufferManager(STORAGE_KEYS.PROBLEM_DATA, TTL.TWO_WEEKS),
  [SHEETS.COMPANY_TAGS]: new GoogleSheetsBufferManager(STORAGE_KEYS.COMPANY_DATA, TTL.ONE_DAY),
  // 🟡 24h
  [SHEETS.EDITORIALS]: new GoogleSheetsBufferManager(STORAGE_KEYS.EDITORIAL, TTL.TWO_WEEKS),
  [SHEETS.TOP_PROBLEMS]: new GoogleSheetsBufferManager(STORAGE_KEYS.TOP_PROBLEMS, TTL.TWO_WEEKS)
};
class GoogleSheetsDataGrabber {
  /**
   * Get data for a sheet tab — serves from cache if valid, fetches otherwise.
   * @param {string} sheetName - One of the SHEETS.* constants
   * @returns {Promise<any[][]>}
   */
  static async getData(sheetName) {
    const buffer = buffers[sheetName];
    if (!buffer) throw new Error(`[LC-Unlock] No buffer registered for: ${sheetName}`);
    const cached = await buffer.get();
    if (cached) {
      console.info(`[LC-Unlock] Cache hit for "${sheetName}"`);
      return cached;
    }
    console.info(`[LC-Unlock] Cache miss for "${sheetName}" — fetching…`);
    const rows = await fetcher.fetchAll(sheetName);
    if (rows && rows.length > 0) {
      await buffer.set(rows);
    }
    return rows;
  }

  /**
   * Force-refresh a sheet tab, bypassing cache.
   * @param {string} sheetName
   * @returns {Promise<any[][]>}
   */
  static async refresh(sheetName) {
    const buffer = buffers[sheetName];
    if (buffer) await buffer.clear();
    return GoogleSheetsDataGrabber.getData(sheetName);
  }

  /**
   * Returns the buffer age (in seconds) for a sheet, or null if not cached.
   * @param {string} sheetName
   * @returns {Promise<number|null>}
   */
  static async getAge(sheetName) {
    const buffer = buffers[sheetName];
    return buffer ? buffer.getAge() : null;
  }
}
;// ./src/modules/ElementGenerator/ElementHelperClass.js
/**
 * ElementHelperClass
 * Utility factory and helper methods for DOM element creation.
 * All ElementModifiers and ContentBuilders use this as their base.
 * 🟢 Fix: Uses LeetCode CSS custom properties instead of hardcoded hex colors.
 */

class ElementHelperClass {
  /**
   * Create a DOM element with optional attributes and children.
   * @param {string} tag
   * @param {Object} [attrs]
   * @param {...(Node|string)} children
   * @returns {HTMLElement}
   */
  static create(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class') {
        el.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else {
        el.setAttribute(key, val);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
  }

  /**
   * Find a single element by CSS selector, optionally scoped to a parent.
   * @param {string} selector
   * @param {Element} [parent=document]
   * @returns {Element|null}
   */
  static qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * Find all elements matching a CSS selector.
   * @param {string} selector
   * @param {Element} [parent=document]
   * @returns {NodeList}
   */
  static qsa(selector, parent = document) {
    return parent.querySelectorAll(selector);
  }

  /**
   * Add one or more CSS classes to an element.
   * @param {Element} el
   * @param {...string} classes
   */
  static addClass(el, ...classes) {
    el.classList.add(...classes);
  }

  /**
   * Remove one or more CSS classes from an element.
   * @param {Element} el
   * @param {...string} classes
   */
  static removeClass(el, ...classes) {
    el.classList.remove(...classes);
  }

  /**
   * Remove an element from the DOM.
   * @param {Element} el
   */
  static remove(el) {
    var _el$parentNode;
    el === null || el === void 0 || (_el$parentNode = el.parentNode) === null || _el$parentNode === void 0 || _el$parentNode.removeChild(el);
  }

  /**
   * Hide an element using inline display:none.
   * @param {Element} el
   */
  static hide(el) {
    if (el) el.style.display = 'none';
  }

  /**
   * Show an element (resets display).
   * @param {Element} el
   * @param {string} [display='']
   */
  static show(el, display = '') {
    if (el) el.style.display = display;
  }

  /**
   * Observe DOM mutations at the body level with a callback.
   * @param {Function} callback
   * @returns {MutationObserver}
   */
  static observeDOM(callback) {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    return observer;
  }

  /**
   * Wait for an element matching selector to appear in the DOM.
   * @param {string} selector
   * @param {number} [timeout=10000]
   * @returns {Promise<Element>}
   */
  static waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`[LC-Unlock] Timeout waiting for: ${selector}`));
      }, timeout);
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
}
;// ./src/modules/ElementModifier/ProblemTableElementModifier.js
/**
 * ProblemTableElementModifier
 * Patches the /problemset/ page:
 * - Removes lock icons from premium problem rows
 * - Injects green frequency progress bars
 * - Rewires locked links to open our modal on click
 */


class ProblemTableElementModifier {
  /**
   * Inject frequency bar into a problem row element.
   * @param {Element} rowEl      - The <tr> or row container
   * @param {number}  frequency  - 0-100 normalized score
   */
  static injectFrequencyBar(rowEl, frequency) {
    const existing = rowEl.querySelector('.lc-unlock-freq-bar-wrap');
    if (existing) return; // Already patched

    const bar = ElementHelperClass.create('div', {
      class: 'lc-unlock-freq-bar-wrap'
    }, ElementHelperClass.create('div', {
      class: 'lc-unlock-freq-bar-fill',
      style: {
        width: `${Math.min(100, Math.round(frequency))}%`
      }
    }));

    // Try to find a frequency/acceptance cell to place the bar into
    const cells = rowEl.querySelectorAll('td');
    const target = cells[cells.length - 1];
    if (target) target.appendChild(bar);
  }

  /**
   * Remove lock/blur indicators from a row.
   * @param {Element} rowEl
   */
  static removeLock(rowEl) {
    rowEl.querySelectorAll('[class*="lock"], [class*="blur"], [class*="premium"]').forEach(el => el.remove());

    // Remove inline blur filters
    rowEl.querySelectorAll('[style*="blur"]').forEach(el => {
      el.style.filter = 'none';
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    });
  }

  /**
   * Rewire a locked anchor to fire a click handler instead of navigating.
   * @param {Element} linkEl
   * @param {Function} onClick
   */
  static rewireLink(linkEl, onClick) {
    var _linkEl$parentNode;
    const clone = linkEl.cloneNode(true);
    clone.setAttribute('href', 'javascript:void(0)');
    clone.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    (_linkEl$parentNode = linkEl.parentNode) === null || _linkEl$parentNode === void 0 || _linkEl$parentNode.replaceChild(clone, linkEl);
  }
}
;// ./src/modules/ElementGenerator/TableContentElementGenerator.js
/**
 * TableContentElementGenerator
 * Generates individual HTML table row elements for the problem list table.
 * Each row represents one LeetCode problem with frequency, difficulty, etc.
 * 🟢 Fix: Uses LeetCode CSS custom properties instead of hard-coded hex colors.
 */



const DIFFICULTY_COLOR = {
  [DIFFICULTY.EASY]: 'var(--lc-difficulty-easy,   #00b8a3)',
  [DIFFICULTY.MEDIUM]: 'var(--lc-difficulty-medium, #ffc01e)',
  [DIFFICULTY.HARD]: 'var(--lc-difficulty-hard,   #ef4743)'
};
class TableContentElementGenerator {
  /**
   * Build a <tr> element for one problem.
   * @param {Object} problem
   * @param {number} problem.id
   * @param {string} problem.name
   * @param {string} problem.slug
   * @param {string} problem.difficulty
   * @param {number} problem.acceptance
   * @param {number} problem.frequency  - 0-100 normalized score
   * @param {Function} onRowClick       - called with problem on click
   * @returns {HTMLTableRowElement}
   */
  static buildRow(problem, onRowClick) {
    const {
      id,
      name,
      slug,
      difficulty,
      acceptance,
      frequency
    } = problem;
    const freqBar = ElementHelperClass.create('div', {
      class: 'lc-unlock-freq-bar-wrap'
    }, ElementHelperClass.create('div', {
      class: 'lc-unlock-freq-bar-fill',
      style: {
        width: `${Math.round(frequency)}%`
      }
    }));
    const diffBadge = ElementHelperClass.create('span', {
      class: 'lc-unlock-difficulty',
      style: {
        color: DIFFICULTY_COLOR[difficulty] ?? 'inherit'
      }
    }, difficulty);
    const nameCell = ElementHelperClass.create('a', {
      class: 'lc-unlock-prob-name',
      href: `https://leetcode.com/problems/${slug}/`,
      target: '_blank'
    }, `${id}. ${name}`);
    const tr = ElementHelperClass.create('tr', {
      class: 'lc-unlock-prob-row',
      'data-slug': slug
    }, ElementHelperClass.create('td', {}, String(id)), ElementHelperClass.create('td', {}, nameCell), ElementHelperClass.create('td', {}, diffBadge), ElementHelperClass.create('td', {}, `${acceptance}%`), ElementHelperClass.create('td', {}, freqBar));
    if (typeof onRowClick === 'function') {
      tr.addEventListener('click', () => onRowClick(problem));
    }
    return tr;
  }

  /**
   * Build the <thead> for the problem table.
   * @param {Function} onSort - called with column key when header clicked
   * @returns {HTMLTableSectionElement}
   */
  static buildHeader(onSort) {
    const cols = [{
      label: '#',
      key: 'id'
    }, {
      label: 'Title',
      key: 'name'
    }, {
      label: 'Difficulty',
      key: 'difficulty'
    }, {
      label: 'Acceptance',
      key: 'acceptance'
    }, {
      label: 'Frequency',
      key: 'frequency'
    }];
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const {
      label,
      key
    } of cols) {
      const th = ElementHelperClass.create('th', {
        class: 'lc-unlock-th',
        'data-sort': key
      }, label);
      if (typeof onSort === 'function') {
        th.addEventListener('click', () => onSort(key));
      }
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    return thead;
  }
}
;// ./src/modules/ElementGenerator/TagContentElementGenerator.js
/**
 * TagContentElementGenerator
 * Generates company-tag chip elements shown on problem detail pages.
 * 🟢 Fix: Uses LeetCode CSS custom properties for consistent dark/light mode.
 */


class TagContentElementGenerator {
  /**
   * Build a clickable chip for a single company tag.
   * @param {string} company  - Company name
   * @param {number} count    - Number of times this company asked the problem
   * @param {Function} [onClick]
   * @returns {HTMLElement}
   */
  static buildChip(company, count, onClick) {
    const chip = ElementHelperClass.create('span', {
      class: 'lc-unlock-company-chip'
    }, ElementHelperClass.create('span', {
      class: 'lc-unlock-chip-name'
    }, company), ElementHelperClass.create('span', {
      class: 'lc-unlock-chip-count'
    }, String(count)));
    if (typeof onClick === 'function') {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        onClick(company);
      });
    }
    return chip;
  }

  /**
   * Build a container of company chips.
   * @param {Array<{company: string, count: number}>} companies
   * @param {Function} [onChipClick]
   * @returns {HTMLElement}
   */
  static buildChipContainer(companies, onChipClick) {
    const container = ElementHelperClass.create('div', {
      class: 'lc-unlock-company-chips'
    });
    for (const {
      company,
      count
    } of companies) {
      container.appendChild(TagContentElementGenerator.buildChip(company, count, onChipClick));
    }
    return container;
  }

  /**
   * Build a time-window tab strip (6 Months / 1 Year / 2 Years / All Time).
   * @param {string[]} windows     - Array of label strings
   * @param {number} activeIndex   - Index of initially active tab
   * @param {Function} onTabChange - called with index when tab changes
   * @returns {HTMLElement}
   */
  static buildTabStrip(windows, activeIndex, onTabChange) {
    const strip = ElementHelperClass.create('div', {
      class: 'lc-unlock-tab-strip'
    });
    windows.forEach((label, i) => {
      const tab = ElementHelperClass.create('button', {
        class: `lc-unlock-tab${i === activeIndex ? ' active' : ''}`,
        'data-index': String(i)
      }, label);
      tab.addEventListener('click', () => {
        strip.querySelectorAll('.lc-unlock-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (typeof onTabChange === 'function') onTabChange(i);
      });
      strip.appendChild(tab);
    });
    return strip;
  }
}
;// ./src/modules/ProblemSorter.js
/**
 * ProblemSorter
 * Strategy pattern — interchangeable sort algorithms for problem lists.
 * Sort field and direction are swappable at runtime.
 */


const DIFFICULTY_ORDER = {
  [DIFFICULTY.EASY]: 1,
  [DIFFICULTY.MEDIUM]: 2,
  [DIFFICULTY.HARD]: 3
};
class ProblemSorter {
  /**
   * @param {string} field     - One of SORT_FIELDS.*
   * @param {'asc'|'desc'} dir - Sort direction
   */
  constructor(field = SORT_FIELDS.FREQUENCY, dir = 'desc') {
    this.field = field;
    this.dir = dir;
  }

  /** Toggle sort direction. */
  toggleDir() {
    this.dir = this.dir === 'asc' ? 'desc' : 'asc';
  }

  /**
   * Sort an array of problem objects in-place.
   * @param {Object[]} problems
   * @returns {Object[]}
   */
  sort(problems) {
    const mult = this.dir === 'desc' ? -1 : 1;
    return problems.sort((a, b) => {
      var _a$name, _b$name;
      let va, vb;
      switch (this.field) {
        case SORT_FIELDS.FREQUENCY:
          va = a.frequency ?? 0;
          vb = b.frequency ?? 0;
          break;
        case SORT_FIELDS.DIFFICULTY:
          va = DIFFICULTY_ORDER[a.difficulty] ?? 0;
          vb = DIFFICULTY_ORDER[b.difficulty] ?? 0;
          break;
        case SORT_FIELDS.NAME:
          va = ((_a$name = a.name) === null || _a$name === void 0 ? void 0 : _a$name.toLowerCase()) ?? '';
          vb = ((_b$name = b.name) === null || _b$name === void 0 ? void 0 : _b$name.toLowerCase()) ?? '';
          break;
        case SORT_FIELDS.ID:
          va = a.id ?? 0;
          vb = b.id ?? 0;
          break;
        case SORT_FIELDS.ACCEPTANCE:
          va = a.acceptance ?? 0;
          vb = b.acceptance ?? 0;
          break;
        default:
          return 0;
      }
      if (va < vb) return -1 * mult;
      if (va > vb) return 1 * mult;
      return 0;
    });
  }
}
;// ./src/modules/ContentBuilder/TableContentBuilder.js
/**
 * TableContentBuilder
 * Assembles the full sortable problem table with time-window tabs.
 * Tabs: 6 Months / 1 Year / 2 Years / All Time
 * 🟢 Feature: Live search/filter input added to company problem modal.
 */






class TableContentBuilder {
  /**
   * Build a complete tabbed problem table.
   * @param {Object[][][]} problemsByWindow - Array of problem arrays, one per time window
   * @param {Function} [onRowClick]
   * @returns {HTMLElement}
   */
  static build(problemsByWindow, onRowClick) {
    const sorter = new ProblemSorter(SORT_FIELDS.FREQUENCY, 'desc');
    let activeTab = 0;
    const wrapper = ElementHelperClass.create('div', {
      class: 'lc-unlock-table-wrap'
    });

    // ── Search Bar ──────────────────────────────────────────────────────────
    const searchInput = ElementHelperClass.create('input', {
      class: 'lc-unlock-search',
      type: 'text',
      placeholder: 'Search problems…',
      id: 'lc-unlock-search-input'
    });

    // ── Tab Strip ────────────────────────────────────────────────────────────
    const tabStrip = TagContentElementGenerator.buildTabStrip(TIME_WINDOWS, activeTab, idx => {
      activeTab = idx;
      rebuildTable();
    });

    // ── Table ─────────────────────────────────────────────────────────────────
    const table = ElementHelperClass.create('table', {
      class: 'lc-unlock-table'
    });
    const rebuildTable = () => {
      const query = searchInput.value.trim().toLowerCase();
      let problems = [...(problemsByWindow[activeTab] ?? [])];
      if (query) {
        problems = problems.filter(p => {
          var _p$name;
          return ((_p$name = p.name) === null || _p$name === void 0 ? void 0 : _p$name.toLowerCase().includes(query)) || String(p.id).includes(query);
        });
      }
      sorter.sort(problems);
      table.innerHTML = '';
      const thead = TableContentElementGenerator.buildHeader(col => {
        if (sorter.field === col) sorter.toggleDir();else {
          sorter.field = col;
          sorter.dir = 'desc';
        }
        rebuildTable();
      });
      const tbody = document.createElement('tbody');
      for (const prob of problems) {
        tbody.appendChild(TableContentElementGenerator.buildRow(prob, onRowClick));
      }
      table.appendChild(thead);
      table.appendChild(tbody);
    };
    searchInput.addEventListener('input', rebuildTable);
    rebuildTable();
    wrapper.appendChild(searchInput);
    wrapper.appendChild(tabStrip);
    wrapper.appendChild(table);
    return wrapper;
  }
}
;// ./src/modules/ContainerManager.js
/**
 * ContainerManager
 * Singleton — manages the single in-page overlay modal.
 * Handles open/close, loading state, and outside-click dismissal.
 */


let instance = null;
class ContainerManager {
  static getInstance() {
    if (!instance) instance = new ContainerManager();
    return instance;
  }
  constructor() {
    if (instance) return instance;
    this._buildModal();
    instance = this;
  }
  _buildModal() {
    // Backdrop
    this.backdrop = ElementHelperClass.create('div', {
      class: 'lc-unlock-backdrop',
      id: 'lc-unlock-backdrop'
    });

    // Modal box
    this.modal = ElementHelperClass.create('div', {
      class: 'lc-unlock-modal',
      id: 'lc-unlock-modal',
      role: 'dialog',
      'aria-modal': 'true'
    });

    // Close button
    const closeBtn = ElementHelperClass.create('button', {
      class: 'lc-unlock-close-btn',
      'aria-label': 'Close',
      id: 'lc-unlock-close-btn'
    }, '✕');
    closeBtn.addEventListener('click', () => this.close());

    // Content area
    this.content = ElementHelperClass.create('div', {
      class: 'lc-unlock-modal-content'
    });
    this.modal.appendChild(closeBtn);
    this.modal.appendChild(this.content);
    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    // Close on backdrop click (outside modal)
    this.backdrop.addEventListener('click', e => {
      if (e.target === this.backdrop) this.close();
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });
  }

  /** Open modal and set content. */
  open(contentEl) {
    this.content.innerHTML = '';
    this.content.appendChild(contentEl);
    this.backdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  /** Show a loading spinner inside the modal. */
  openLoading(message = 'Loading…') {
    const loader = ElementHelperClass.create('div', {
      class: 'lc-unlock-loader'
    }, ElementHelperClass.create('div', {
      class: 'lc-unlock-spinner'
    }), ElementHelperClass.create('p', {}, message));
    this.open(loader);
  }

  /** Replace modal content (after data loads). */
  setContent(contentEl) {
    this.content.innerHTML = '';
    this.content.appendChild(contentEl);
  }

  /** Close and clear the modal. */
  close() {
    this.backdrop.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => {
      this.content.innerHTML = '';
    }, 300);
  }

  /** Returns true if modal is currently open. */
  isOpen() {
    return this.backdrop.classList.contains('visible');
  }
}
;// ./src/modules/AnalyticsManager.js
/**
 * AnalyticsManager
 * Singleton — Firebase GA4 event logger.
 * Disabled by default (enableAnalytics = false in DEFAULT_SETTINGS).
 */

let AnalyticsManager_instance = null;
class AnalyticsManager {
  static getInstance() {
    if (!AnalyticsManager_instance) AnalyticsManager_instance = new AnalyticsManager();
    return AnalyticsManager_instance;
  }
  constructor() {
    if (AnalyticsManager_instance) return AnalyticsManager_instance;
    this.enabled = false; // off by default
    AnalyticsManager_instance = this;
  }

  /**
   * Enable or disable analytics at runtime.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  /**
   * Log a named event with optional payload.
   * @param {string} eventName
   * @param {Object} [params]
   */
  log(eventName, params = {}) {
    if (!this.enabled) return;
    try {
      // If Firebase is loaded on the page, use its gtag
      if (typeof gtag === 'function') {
        gtag('event', eventName, params);
      } else {
        console.debug('[LC-Unlock] Analytics (noOp):', eventName, params);
      }
    } catch (_) {/* fail silently */}
  }
}
;// ./src/modules/Unlocker/ProblemTableUnlocker.js
/**
 * ProblemTableUnlocker
 * Activates on /problemset/ pages.
 * Batch-fetches all problem data, injects frequency bars, removes locks.
 */








class ProblemTableUnlocker {
  constructor() {
    this.modal = ContainerManager.getInstance();
    this.analytics = AnalyticsManager.getInstance();
    this.problems = null; // cached parsed problems
  }

  /** Check if this page should be unlocked. */
  static matches() {
    return URL_PATTERNS.PROBLEM_SET.test(window.location.href);
  }

  /** Entry point — called from main.js */
  async init() {
    try {
      const settings = await this._getSettings();
      if (!settings.enableFrequencyBars) return;

      // 🟡 Batch-fetch all problems at once
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.PROBLEM_DATA);
      this.problems = this._parseRows(rows);

      // Build a slug→problem map for fast lookup
      this.slugMap = new Map(this.problems.map(p => [p.slug, p]));

      // Patch existing rows then watch for new ones (virtual scroll)
      this._patchAllRows();
      ElementHelperClass.observeDOM(() => this._patchAllRows());
    } catch (err) {
      console.error('[LC-Unlock] ProblemTableUnlocker error:', err);
    }
  }
  _patchAllRows() {
    document.querySelectorAll('tr, [class*="problem-row"]').forEach(row => {
      var _link$href$match;
      if (row.dataset.lcUnlocked) return;
      const link = row.querySelector('a[href*="/problems/"]');
      if (!link) return;
      const slug = (_link$href$match = link.href.match(/\/problems\/([^/]+)\//)) === null || _link$href$match === void 0 ? void 0 : _link$href$match[1];
      if (!slug || !this.slugMap.has(slug)) return;
      const problem = this.slugMap.get(slug);
      ProblemTableElementModifier.removeLock(row);
      ProblemTableElementModifier.injectFrequencyBar(row, problem.frequency ?? 0);
      ProblemTableElementModifier.rewireLink(link, () => this._openModal(problem));
      row.dataset.lcUnlocked = '1';
    });
  }
  _openModal(problem) {
    var _problem$companiesByW, _problem$companiesByW2, _problem$companiesByW3, _problem$companiesByW4;
    this.modal.openLoading('Loading problem data…');
    this.analytics.log('problem_table_click', {
      slug: problem.slug
    });

    // Group into time windows (all same for table-level data)
    const byWindow = [((_problem$companiesByW = problem.companiesByWindow) === null || _problem$companiesByW === void 0 ? void 0 : _problem$companiesByW[0]) ?? [], ((_problem$companiesByW2 = problem.companiesByWindow) === null || _problem$companiesByW2 === void 0 ? void 0 : _problem$companiesByW2[1]) ?? [], ((_problem$companiesByW3 = problem.companiesByWindow) === null || _problem$companiesByW3 === void 0 ? void 0 : _problem$companiesByW3[2]) ?? [], ((_problem$companiesByW4 = problem.companiesByWindow) === null || _problem$companiesByW4 === void 0 ? void 0 : _problem$companiesByW4[3]) ?? []];
    const content = TableContentBuilder.build([[problem], [problem], [problem], [problem]]);
    this.modal.setContent(content);
  }

  /** Parse raw Sheets rows into problem objects. */
  _parseRows(rows) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return [];
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    return data.map(row => ({
      id: Number(row[idx.id] ?? 0),
      name: row[idx.name] ?? '',
      slug: row[idx.slug] ?? '',
      difficulty: row[idx.difficulty] ?? '',
      acceptance: parseFloat(row[idx.acceptance] ?? 0),
      frequency: parseFloat(row[idx.frequency] ?? 0),
      tags: (row[idx.tags] ?? '').split(',').map(s => s.trim())
    }));
  }
  async _getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...(r[STORAGE_KEYS.SETTINGS] ?? {})
        });
      });
    });
  }
}
;// ./src/modules/ElementModifier/CompanySwipperElementModifier.js
/**
 * CompanySwipperElementModifier
 * Patches the company swiper/carousel widget that appears on some LeetCode pages.
 * Removes locked overlays and injects real company data links.
 */


class CompanySwipperElementModifier {
  /**
   * Remove lock overlays from every company card in the swiper.
   */
  static removeLocks() {
    document.querySelectorAll('[class*="company-card"], [class*="companyCard"], [class*="swiper-slide"]').forEach(card => {
      card.querySelectorAll('[class*="lock"], [class*="premium"]').forEach(el => el.remove());
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
    document.querySelectorAll('[class*="company-card"], [class*="companyCard"]').forEach(card => {
      var _nameEl$textContent;
      const nameEl = card.querySelector('[class*="name"], [class*="title"]');
      if (!nameEl) return;
      const company = (_nameEl$textContent = nameEl.textContent) === null || _nameEl$textContent === void 0 ? void 0 : _nameEl$textContent.trim();
      const count = companyCountMap.get(company);
      if (count == null) return;
      const existing = card.querySelector('.lc-unlock-count-badge');
      if (existing) {
        existing.textContent = count;
        return;
      }
      const badge = ElementHelperClass.create('span', {
        class: 'lc-unlock-count-badge'
      }, String(count));
      card.appendChild(badge);
    });
  }
}
;// ./src/modules/Unlocker/CompaniesProblemUnlocker.js
/**
 * CompaniesProblemUnlocker
 * Activates on /company/* pages and the company tag swiper widget.
 * Fetches company problem lists and injects them into the UI.
 * 🟡 Fix: Company data cached with 24h TTL (defined in GoogleSheetsDataGrabber).
 */








class CompaniesProblemUnlocker {
  constructor() {
    this.modal = ContainerManager.getInstance();
    this.analytics = AnalyticsManager.getInstance();
  }
  static matches() {
    return URL_PATTERNS.COMPANY.test(window.location.href) || document.querySelector('[class*="company-tags"], [class*="companyTags"]') !== null;
  }
  async init() {
    try {
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.COMPANY_TAGS);
      const companyMap = this._parseRows(rows); // Map<company, {byWindow: Problem[][]}>

      // Patch swiper cards
      const countMap = new Map([...companyMap.entries()].map(([c, d]) => {
        var _d$byWindow$;
        return [c, ((_d$byWindow$ = d.byWindow[3]) === null || _d$byWindow$ === void 0 ? void 0 : _d$byWindow$.length) ?? 0];
      }));
      CompanySwipperElementModifier.removeLocks();
      CompanySwipperElementModifier.injectCounts(countMap);

      // Wire each company card to open a modal
      document.querySelectorAll('[class*="company-card"], [class*="companyCard"]').forEach(card => {
        var _nameEl$textContent;
        const nameEl = card.querySelector('[class*="name"], [class*="title"]');
        const company = nameEl === null || nameEl === void 0 || (_nameEl$textContent = nameEl.textContent) === null || _nameEl$textContent === void 0 ? void 0 : _nameEl$textContent.trim();
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
    this.analytics.log('company_click', {
      company
    });
    const content = TableContentBuilder.build(problemsByWindow);
    const title = ElementHelperClass.create('h3', {
      class: 'lc-unlock-modal-title'
    }, `${company} — Problems`);
    const wrap = ElementHelperClass.create('div', {});
    wrap.appendChild(title);
    wrap.appendChild(content);
    this.modal.setContent(wrap);
  }

  /** Parse rows into Map<company, { byWindow: Problem[][] }> */
  _parseRows(rows) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return new Map();
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    const map = new Map();
    for (const row of data) {
      var _map$get$byWindow$win;
      const company = row[idx.company] ?? '';
      const windowIdx = Number(row[idx.window] ?? 3); // 0=6m,1=1yr,2=2yr,3=all
      const problem = {
        id: Number(row[idx.id] ?? 0),
        name: row[idx.name] ?? '',
        slug: row[idx.slug] ?? '',
        difficulty: row[idx.difficulty] ?? '',
        acceptance: parseFloat(row[idx.acceptance] ?? 0),
        frequency: parseFloat(row[idx.frequency] ?? 0)
      };
      if (!map.has(company)) map.set(company, {
        byWindow: [[], [], [], []]
      });
      (_map$get$byWindow$win = map.get(company).byWindow[windowIdx]) === null || _map$get$byWindow$win === void 0 || _map$get$byWindow$win.push(problem);
    }
    return map;
  }
}
;// ./src/modules/ElementModifier/EditorialPageElementModifier.js
/**
 * EditorialPageElementModifier
 * Patches the editorial tab on a problem detail page.
 * Replaces the premium paywall with a clickable trigger that opens the editorial modal.
 */


class EditorialPageElementModifier {
  /**
   * Replace the premium editorial wall with a styled unlock button.
   * @param {Function} onUnlock - Called when user clicks the unlock prompt
   */
  static injectUnlockPrompt(onUnlock) {
    // Common containers LeetCode uses for the editorial paywall
    const selectors = ['[class*="editorial"]', '[class*="solution-content"]', '[data-key="editorial"]'];
    let target = null;
    for (const sel of selectors) {
      target = document.querySelector(sel);
      if (target) break;
    }
    if (!target) {
      console.warn('[LC-Unlock] EditorialPageElementModifier: editorial container not found.');
      return;
    }

    // Remove existing paywall
    target.querySelectorAll('[class*="premium"], [class*="lock"], [class*="upgrade"]').forEach(el => el.remove());
    const prompt = ElementHelperClass.create('div', {
      class: 'lc-unlock-editorial-prompt'
    }, ElementHelperClass.create('p', {}, '🔓 Editorial unlocked — click to view.'), ElementHelperClass.create('button', {
      class: 'lc-unlock-btn',
      id: 'lc-unlock-editorial-btn',
      onclick: onUnlock
    }, 'View Editorial'));
    target.innerHTML = '';
    target.appendChild(prompt);
  }

  /**
   * Replace the prompt with the actual editorial content element.
   * @param {HTMLElement} contentEl - Built by EditorialContentBuilder
   */
  static showContent(contentEl) {
    var _document$getElementB;
    const prompt = (_document$getElementB = document.getElementById('lc-unlock-editorial-btn')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.parentElement;
    const target = (prompt === null || prompt === void 0 ? void 0 : prompt.parentElement) ?? document.querySelector('[class*="editorial"]');
    if (target) {
      target.innerHTML = '';
      target.appendChild(contentEl);
    }
  }
}
// EXTERNAL MODULE: ./node_modules/dompurify/dist/purify.es.mjs
var purify_es = __webpack_require__(418);
;// ./src/modules/ContentBuilder/EditorialContentBuilder.js
/**
 * EditorialContentBuilder
 * Assembles the editorial/solution content shown in a modal.
 * HTML is sanitized via DOMPurify before injection.
 * 🟢 Feature: Prism.js syntax highlighting for code blocks.
 * 🔴 Fix: Content sanitized with DOMPurify — no XSS risk.
 */




let Prism = null;
async function loadPrism() {
  if (Prism) return Prism;
  const base = await __webpack_require__.e(/* import() */ 848).then(__webpack_require__.t.bind(__webpack_require__, 848, 23));
  Prism = base.default;
  await __webpack_require__.e(/* import() */ 342).then(__webpack_require__.t.bind(__webpack_require__, 342, 23));
  await __webpack_require__.e(/* import() */ 976).then(__webpack_require__.t.bind(__webpack_require__, 976, 23));
  await __webpack_require__.e(/* import() */ 415).then(__webpack_require__.t.bind(__webpack_require__, 415, 23));
  await __webpack_require__.e(/* import() */ 723).then(__webpack_require__.t.bind(__webpack_require__, 723, 23));
  return Prism;
}
class EditorialContentBuilder {
  /**
   * Build a sanitized, syntax-highlighted editorial panel.
   * @param {Object} editorial
   * @param {string} editorial.title       - Problem title
   * @param {string} editorial.content     - Raw HTML editorial content
   * @param {string} [editorial.difficulty]
   * @returns {HTMLElement}
   */
  static async build(editorial) {
    const {
      title,
      content,
      difficulty
    } = editorial;
    const wrapper = ElementHelperClass.create('div', {
      class: 'lc-unlock-editorial-wrap'
    });

    // ── Title bar ─────────────────────────────────────────────────────────────
    const titleBar = ElementHelperClass.create('div', {
      class: 'lc-unlock-editorial-title'
    }, ElementHelperClass.create('h2', {}, title ?? 'Editorial'), difficulty ? ElementHelperClass.create('span', {
      class: `lc-unlock-difficulty lc-diff-${difficulty === null || difficulty === void 0 ? void 0 : difficulty.toLowerCase()}`
    }, difficulty) : null);

    // ── Sanitized content body ────────────────────────────────────────────────
    const body = ElementHelperClass.create('div', {
      class: 'lc-unlock-editorial-body'
    });
    const sanitized = purify_es/* default */.A.sanitize(content ?? '', {
      USE_PROFILES: {
        html: true
      },
      ADD_TAGS: ['pre', 'code']
    });
    body.innerHTML = sanitized;

    // ── Prism.js syntax highlight ─────────────────────────────────────────────
    const PrismLib = await loadPrism();
    body.querySelectorAll('pre code').forEach(block => {
      PrismLib.highlightElement(block);
    });
    wrapper.appendChild(titleBar);
    wrapper.appendChild(body);
    return wrapper;
  }

  /**
   * Build a loading placeholder shown while editorial is being fetched.
   * @returns {HTMLElement}
   */
  static buildLoader() {
    return ElementHelperClass.create('div', {
      class: 'lc-unlock-loader'
    }, ElementHelperClass.create('div', {
      class: 'lc-unlock-spinner'
    }), ElementHelperClass.create('p', {}, 'Loading editorial…'));
  }
}
;// ./src/modules/Unlocker/EditorialUnlocker.js
/**
 * EditorialUnlocker
 * Activates on /problems/<slug>/ pages.
 * Replaces the premium editorial paywall with real editorial content from Sheets.
 */






class EditorialUnlocker {
  constructor() {
    var _window$location$path;
    this.analytics = AnalyticsManager.getInstance();
    this.slug = ((_window$location$path = window.location.pathname.match(/\/problems\/([^/]+)\//)) === null || _window$location$path === void 0 ? void 0 : _window$location$path[1]) ?? null;
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
      EditorialPageElementModifier.injectUnlockPrompt(() => this._loadAndShow());
    } catch (err) {
      console.error('[LC-Unlock] EditorialUnlocker error:', err);
    }
  }
  async _loadAndShow() {
    try {
      this.analytics.log('editorial_click', {
        slug: this.slug
      });
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.EDITORIALS);
      const editorial = this._findEditorial(rows, this.slug);
      if (!editorial) {
        EditorialPageElementModifier.showContent(Object.assign(document.createElement('p'), {
          textContent: 'Editorial not available for this problem.',
          className: 'lc-unlock-empty'
        }));
        return;
      }
      const contentEl = await EditorialContentBuilder.build(editorial);
      EditorialPageElementModifier.showContent(contentEl);
    } catch (err) {
      console.error('[LC-Unlock] EditorialUnlocker load error:', err);
    }
  }
  _findEditorial(rows, slug) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return null;
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    const row = data.find(r => r[idx.slug] === slug);
    if (!row) return null;
    return {
      title: row[idx.title] ?? slug,
      content: row[idx.content] ?? '',
      difficulty: row[idx.difficulty] ?? '',
      slug
    };
  }
  async _getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...(r[STORAGE_KEYS.SETTINGS] ?? {})
        });
      });
    });
  }
}
;// ./src/modules/ElementModifier/ProblemTagsElementModifier.js
/**
 * ProblemTagsElementModifier
 * Patches the company-tags section on a problem detail page.
 * Replaces premium-locked tag placeholders with real chip elements.
 */


class ProblemTagsElementModifier {
  /**
   * Find and replace the locked tags container with real content.
   * @param {HTMLElement} realContent - Built by TagsContentBuilder
   */
  static inject(realContent) {
    // Selectors that LeetCode uses for the premium tags wall
    const selectors = ['[class*="company-tags"]', '[class*="companyTags"]', '[class*="tag-container"]', '[id*="company"]'];
    let target = null;
    for (const sel of selectors) {
      target = document.querySelector(sel);
      if (target) break;
    }
    if (!target) {
      console.warn('[LC-Unlock] ProblemTagsElementModifier: tags container not found.');
      return;
    }
    target.innerHTML = '';
    target.appendChild(realContent);
  }

  /**
   * Remove a premium upgrade prompt / paywall banner near tags.
   */
  static removePaywall() {
    document.querySelectorAll('[class*="upgrade"], [class*="premium-banner"], [class*="locked-content"]').forEach(el => el.remove());
  }
}
;// ./src/modules/ContentBuilder/TagsContentBuilder.js
/**
 * TagsContentBuilder
 * Assembles the company-tags section shown on a problem detail page.
 * Renders chips grouped by time window with a tab strip.
 * 🟢 Feature: Live search filter for company chips.
 */




class TagsContentBuilder {
  /**
   * Build the tags section.
   * @param {Object[][]} companiesByWindow - Array per time window, each: [{company, count}]
   * @param {Function} [onChipClick]
   * @returns {HTMLElement}
   */
  static build(companiesByWindow, onChipClick) {
    let activeTab = 0;
    const wrapper = ElementHelperClass.create('div', {
      class: 'lc-unlock-tags-wrap'
    });

    // ── Search filter ─────────────────────────────────────────────────────────
    const searchInput = ElementHelperClass.create('input', {
      class: 'lc-unlock-search lc-unlock-search--sm',
      type: 'text',
      placeholder: 'Filter companies…'
    });

    // ── Tab strip ─────────────────────────────────────────────────────────────
    const tabStrip = TagContentElementGenerator.buildTabStrip(TIME_WINDOWS, activeTab, idx => {
      activeTab = idx;
      renderChips();
    });
    const chipsArea = ElementHelperClass.create('div', {
      class: 'lc-unlock-chips-area'
    });
    const renderChips = () => {
      const query = searchInput.value.trim().toLowerCase();
      let companies = [...(companiesByWindow[activeTab] ?? [])];
      if (query) {
        companies = companies.filter(c => c.company.toLowerCase().includes(query));
      }

      // Sort by count desc
      companies.sort((a, b) => b.count - a.count);
      chipsArea.innerHTML = '';
      if (companies.length === 0) {
        chipsArea.appendChild(ElementHelperClass.create('p', {
          class: 'lc-unlock-empty'
        }, 'No companies found.'));
      } else {
        chipsArea.appendChild(TagContentElementGenerator.buildChipContainer(companies, onChipClick));
      }
    };
    searchInput.addEventListener('input', renderChips);
    renderChips();
    wrapper.appendChild(searchInput);
    wrapper.appendChild(tabStrip);
    wrapper.appendChild(chipsArea);
    return wrapper;
  }
}
;// ./src/modules/Unlocker/ProblemTagsUnlocker.js
/**
 * ProblemTagsUnlocker
 * Activates on /problems/<slug>/ pages.
 * Replaces the premium company-tags section with real chip data from Sheets.
 */






class ProblemTagsUnlocker {
  constructor() {
    var _window$location$path;
    this.analytics = AnalyticsManager.getInstance();
    this.slug = ((_window$location$path = window.location.pathname.match(/\/problems\/([^/]+)\//)) === null || _window$location$path === void 0 ? void 0 : _window$location$path[1]) ?? null;
  }
  static matches() {
    return URL_PATTERNS.PROBLEM_DETAIL.test(window.location.href);
  }
  async init() {
    if (!this.slug) return;
    try {
      const settings = await this._getSettings();
      if (!settings.enableCompanyTags) return;
      ProblemTagsElementModifier.removePaywall();
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.COMPANY_TAGS);
      const companiesByWindow = this._getCompaniesForProblem(rows, this.slug);
      const contentEl = TagsContentBuilder.build(companiesByWindow);
      ProblemTagsElementModifier.inject(contentEl);
      this.analytics.log('tags_unlocked', {
        slug: this.slug
      });
    } catch (err) {
      console.error('[LC-Unlock] ProblemTagsUnlocker error:', err);
    }
  }

  /** Returns a 4-element array: [6m, 1yr, 2yr, all] of [{company, count}] */
  _getCompaniesForProblem(rows, slug) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return [[], [], [], []];
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    const byWindow = [[], [], [], []];
    for (const row of data) {
      if (row[idx.slug] !== slug) continue;
      const windowIdx = Number(row[idx.window] ?? 3);
      const entry = {
        company: row[idx.company] ?? '',
        count: Number(row[idx.count] ?? 1)
      };
      byWindow[Math.min(windowIdx, 3)].push(entry);
    }
    return byWindow;
  }
  async _getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...(r[STORAGE_KEYS.SETTINGS] ?? {})
        });
      });
    });
  }
}
;// ./src/modules/ElementModifier/TagPageProblemTableElementModifier.js
/**
 * TagPageProblemTableElementModifier
 * Patches the problem table on tag-filtered pages (e.g. /tag/array/).
 * Previously a stub — now fully implemented.
 * 🟢 Fix: Complete implementation (was 130-byte stub).
 */


class TagPageProblemTableElementModifier {
  /**
   * Remove premium lock overlays from all rows in the tag page table.
   */
  static removeLocks() {
    document.querySelectorAll('table tr, [class*="problem-row"], [class*="problemRow"]').forEach(row => {
      row.querySelectorAll('[class*="lock"], [class*="premium"]').forEach(el => el.remove());
      row.querySelectorAll('[style*="blur"]').forEach(el => {
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
    document.querySelectorAll('table tr[data-slug], [class*="problem-row"][data-slug]').forEach(row => {
      const slug = row.dataset.slug;
      const freq = slugFreqMap.get(slug);
      if (freq == null) return;
      const existing = row.querySelector('.lc-unlock-freq-bar-wrap');
      if (existing) return;
      const bar = ElementHelperClass.create('div', {
        class: 'lc-unlock-freq-bar-wrap'
      }, ElementHelperClass.create('div', {
        class: 'lc-unlock-freq-bar-fill',
        style: {
          width: `${Math.min(100, Math.round(freq))}%`
        }
      }));
      const lastCell = row.querySelector('td:last-child');
      if (lastCell) lastCell.appendChild(bar);
    });
  }

  /**
   * Rewire locked links in tag-page rows.
   * @param {Function} onLinkClick - called with slug string
   */
  static rewireLockedLinks(onLinkClick) {
    document.querySelectorAll('table tr a[href*="premium"], [class*="problem-row"] a[href*="premium"]').forEach(link => {
      var _link$href$match;
      const slug = (_link$href$match = link.href.match(/\/problems\/([^/]+)\//)) === null || _link$href$match === void 0 ? void 0 : _link$href$match[1];
      if (!slug) return;
      link.setAttribute('href', 'javascript:void(0)');
      link.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        onLinkClick(slug);
      });
    });
  }
}
;// ./src/modules/Unlocker/TagPageProblemTableUnlocker.js
/**
 * TagPageProblemTableUnlocker
 * Activates on /tag/* pages.
 * Injects frequency bars and removes locks from tag-filtered problem tables.
 * 🟢 Fix: Full implementation replacing the original 130-byte stub.
 */








class TagPageProblemTableUnlocker {
  constructor() {
    this.modal = ContainerManager.getInstance();
    this.analytics = AnalyticsManager.getInstance();
  }
  static matches() {
    return URL_PATTERNS.TAG.test(window.location.href);
  }
  async init() {
    try {
      const settings = await this._getSettings();
      if (!settings.enableFrequencyBars) return;
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.PROBLEM_DATA);
      const problems = this._parseRows(rows);
      const slugFreqMap = new Map(problems.map(p => [p.slug, p.frequency ?? 0]));
      const slugProbMap = new Map(problems.map(p => [p.slug, p]));
      TagPageProblemTableElementModifier.removeLocks();
      TagPageProblemTableElementModifier.injectFrequencyBars(slugFreqMap);
      TagPageProblemTableElementModifier.rewireLockedLinks(slug => {
        const problem = slugProbMap.get(slug);
        if (!problem) return;
        this._openModal(problem);
      });
      ElementHelperClass.observeDOM(() => {
        TagPageProblemTableElementModifier.removeLocks();
        TagPageProblemTableElementModifier.injectFrequencyBars(slugFreqMap);
      });
      this.analytics.log('tag_page_unlocked', {
        url: window.location.href
      });
    } catch (err) {
      console.error('[LC-Unlock] TagPageProblemTableUnlocker error:', err);
    }
  }
  _openModal(problem) {
    this.modal.openLoading('Loading problem…');
    const content = TableContentBuilder.build([[problem], [problem], [problem], [problem]]);
    this.modal.setContent(content);
  }
  _parseRows(rows) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return [];
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    return data.map(row => ({
      id: Number(row[idx.id] ?? 0),
      name: row[idx.name] ?? '',
      slug: row[idx.slug] ?? '',
      difficulty: row[idx.difficulty] ?? '',
      acceptance: parseFloat(row[idx.acceptance] ?? 0),
      frequency: parseFloat(row[idx.frequency] ?? 0)
    }));
  }
  async _getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...(r[STORAGE_KEYS.SETTINGS] ?? {})
        });
      });
    });
  }
}
;// ./src/modules/ElementModifier/TopProblemFoldoutElementModifier.js
/**
 * TopProblemFoldoutElementModifier
 * Patches the curated top-problem foldout sections in study plans.
 * Removes lock icons and rewires premium-gated items.
 */


class TopProblemFoldoutElementModifier {
  /**
   * Remove lock icons and premium gates from all foldout items.
   */
  static removeLocks() {
    document.querySelectorAll('[class*="study-plan"], [class*="study_plan"], [class*="top-problem"]').forEach(section => {
      section.querySelectorAll('[class*="lock"], [class*="premium"]').forEach(el => el.remove());
      section.querySelectorAll('[style*="blur"]').forEach(el => {
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
    document.querySelectorAll('[class*="study-plan"] a, [class*="top-problem"] a').forEach(link => {
      var _link$href$match, _link$textContent;
      if (!link.href.includes('/problems/')) return;
      const slug = (_link$href$match = link.href.match(/\/problems\/([^/]+)\//)) === null || _link$href$match === void 0 ? void 0 : _link$href$match[1];
      const title = (_link$textContent = link.textContent) === null || _link$textContent === void 0 ? void 0 : _link$textContent.trim();
      if (!slug) return;
      link.setAttribute('href', 'javascript:void(0)');
      link.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        onLinkClick({
          slug,
          title
        });
      });
    });
  }

  /**
   * Inject a "Unlocked" badge next to each study-plan problem item.
   * @param {Element} [container=document]
   */
  static injectUnlockedBadges(container = document) {
    container.querySelectorAll('[class*="plan-item"], [class*="top-problem-item"]').forEach(item => {
      if (item.querySelector('.lc-unlock-badge')) return;
      const badge = ElementHelperClass.create('span', {
        class: 'lc-unlock-badge'
      }, '🔓');
      item.insertBefore(badge, item.firstChild);
    });
  }
}
;// ./src/modules/Unlocker/TopProblemUnlocker.js
/**
 * TopProblemUnlocker
 * Activates on /study-plan/* pages.
 * Unlocks curated top-problem foldouts by removing locks and wiring click handlers.
 */








class TopProblemUnlocker {
  constructor() {
    this.modal = ContainerManager.getInstance();
    this.analytics = AnalyticsManager.getInstance();
  }
  static matches() {
    return URL_PATTERNS.STUDY_PLAN.test(window.location.href);
  }
  async init() {
    try {
      const settings = await this._getSettings();
      if (!settings.enableTopProblems) return;
      const rows = await GoogleSheetsDataGrabber.getData(SHEETS.TOP_PROBLEMS);
      const problems = this._parseRows(rows);
      const slugMap = new Map(problems.map(p => [p.slug, p]));
      TopProblemFoldoutElementModifier.removeLocks();
      TopProblemFoldoutElementModifier.injectUnlockedBadges();
      TopProblemFoldoutElementModifier.rewireLinks(({
        slug,
        title
      }) => {
        const problem = slugMap.get(slug);
        if (!problem) return;
        this._openModal(problem);
      });

      // Watch for lazy-loaded sections
      ElementHelperClass.observeDOM(() => {
        TopProblemFoldoutElementModifier.removeLocks();
        TopProblemFoldoutElementModifier.injectUnlockedBadges();
      });
      this.analytics.log('top_problem_unlocked', {
        url: window.location.href
      });
    } catch (err) {
      console.error('[LC-Unlock] TopProblemUnlocker error:', err);
    }
  }
  _openModal(problem) {
    this.modal.openLoading('Loading problem…');
    const content = TableContentBuilder.build([[problem], [problem], [problem], [problem]]);
    const title = ElementHelperClass.create('h3', {
      class: 'lc-unlock-modal-title'
    }, problem.name);
    const wrap = ElementHelperClass.create('div', {});
    wrap.appendChild(title);
    wrap.appendChild(content);
    this.modal.setContent(wrap);
    this.analytics.log('top_problem_click', {
      slug: problem.slug
    });
  }
  _parseRows(rows) {
    if (!(rows !== null && rows !== void 0 && rows.length)) return [];
    const [header, ...data] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h === null || h === void 0 ? void 0 : h.toLowerCase(), i]));
    return data.map(row => ({
      id: Number(row[idx.id] ?? 0),
      name: row[idx.name] ?? '',
      slug: row[idx.slug] ?? '',
      difficulty: row[idx.difficulty] ?? '',
      acceptance: parseFloat(row[idx.acceptance] ?? 0),
      frequency: parseFloat(row[idx.frequency] ?? 0)
    }));
  }
  async _getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        resolve({
          ...DEFAULT_SETTINGS,
          ...(r[STORAGE_KEYS.SETTINGS] ?? {})
        });
      });
    });
  }
}
;// ./src/main.js
/**
 * main.js — Content Script Entry Point
 * Detects the current LeetCode page and initialises the matching Unlocker(s).
 * Loaded on every https://leetcode.com/* page via manifest.json.
 */












// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  // Load user settings
  const settings = await getSettings();

  // Enable analytics if opted in
  if (settings.enableAnalytics) {
    AnalyticsManager.getInstance().setEnabled(true);
  }

  // All registered unlockers — each self-selects via .matches()
  const unlockers = [new ProblemTableUnlocker(), new CompaniesProblemUnlocker(), new EditorialUnlocker(), new ProblemTagsUnlocker(), new TagPageProblemTableUnlocker(), new TopProblemUnlocker()];

  // Check static class .matches() to determine which are relevant for this page
  const matched = unlockers.filter(u => u.constructor.matches());
  if (matched.length === 0) return;
  console.info(`[LC-Unlock] Page matched ${matched.length} unlocker(s):`, matched.map(u => u.constructor.name));

  // Run all matched unlockers (they handle their own errors internally)
  await Promise.allSettled(matched.map(u => u.init()));
}
function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
      resolve({
        ...DEFAULT_SETTINGS,
        ...(r[STORAGE_KEYS.SETTINGS] ?? {})
      });
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
  }).observe(document.body, {
    subtree: true,
    childList: true
  });
}

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "lc-main:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			792: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunklc_main"] = self["webpackChunklc_main"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [815,418], () => (__webpack_require__(680)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map