/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 902
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
const TIME_WINDOWS = (/* unused pure expression or super */ null && (['6 Months', '1 Year', '2 Years', 'All Time']));

// ─── URL Patterns ────────────────────────────────────────────────────────────
const URL_PATTERNS = {
  PROBLEM_SET: /leetcode\.com\/problemset\//,
  PROBLEM_DETAIL: /leetcode\.com\/problems\/[^/]+\//,
  COMPANY: /leetcode\.com\/company\//,
  TAG: /leetcode\.com\/tag\//,
  STUDY_PLAN: /leetcode\.com\/study-plan\//
};
;// ./src/background.js
/**
 * background.js — Manifest v3 Service Worker
 * Handles extension install/update events and message passing.
 * Runs in the background, separate from page content scripts.
 */




// ─── Install / Update ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({
  reason
}) => {
  if (reason === 'install') {
    // Write default settings on first install
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
    });
    console.info('[LC-Unlock] Extension installed. Default settings written.');
  }
  if (reason === 'update') {
    // Merge new defaults without overwriting user prefs
    const existing = await new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => resolve(r[STORAGE_KEYS.SETTINGS] ?? {}));
    });
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: {
        ...DEFAULT_SETTINGS,
        ...existing
      }
    });
    console.info('[LC-Unlock] Extension updated. Settings merged.');
  }
});

// ─── Message Handling ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], r => {
        sendResponse({
          settings: {
            ...DEFAULT_SETTINGS,
            ...(r[STORAGE_KEYS.SETTINGS] ?? {})
          }
        });
      });
      return true;
    // async response

    case 'SAVE_SETTINGS':
      chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: message.settings
      }, () => sendResponse({
        ok: true
      }));
      return true;
    case 'CLEAR_CACHE':
      {
        const keysToRemove = [STORAGE_KEYS.PROBLEM_DATA, STORAGE_KEYS.COMPANY_DATA, STORAGE_KEYS.EDITORIAL, STORAGE_KEYS.TOP_PROBLEMS, STORAGE_KEYS.LAST_FETCH];
        chrome.storage.local.remove(keysToRemove, () => {
          sendResponse({
            ok: true
          });
        });
        return true;
      }
    case 'GET_CACHE_AGE':
      {
        const keys = Object.values(STORAGE_KEYS);
        chrome.storage.local.get(keys, r => {
          const ages = {};
          for (const key of keys) {
            const entry = r[key];
            ages[key] = entry !== null && entry !== void 0 && entry.timestamp ? Math.floor((Date.now() - entry.timestamp) / 1000) : null;
          }
          sendResponse({
            ages
          });
        });
        return true;
      }
    default:
      break;
  }
});

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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
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
/******/ 			471: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [815], () => (__webpack_require__(902)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=background.js.map