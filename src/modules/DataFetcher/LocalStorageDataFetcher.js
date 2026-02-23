/**
 * LocalStorageDataFetcher
 * Fallback data fetcher that reads from localStorage.
 * Used when chrome.storage.local is unavailable or for testing.
 */

export class LocalStorageDataFetcher {
    /**
     * @param {string} key - localStorage key to read from
     */
    constructor(key) {
        this.key = key;
    }

    /**
     * Read and parse JSON from localStorage.
     * @returns {any|null}
     */
    get() {
        try {
            const raw = localStorage.getItem(this.key);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.warn('[LC-Unlock] LocalStorageDataFetcher read error:', err);
            return null;
        }
    }

    /**
     * Write data as JSON to localStorage.
     * @param {any} data
     */
    set(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (err) {
            console.warn('[LC-Unlock] LocalStorageDataFetcher write error:', err);
        }
    }

    /** Remove the key from localStorage. */
    clear() {
        localStorage.removeItem(this.key);
    }
}
