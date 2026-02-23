/**
 * GoogleSheetsBufferManager
 * Cache-Aside pattern — wraps chrome.storage.local with a configurable TTL.
 * Default TTL: 2 weeks. Company data uses 24h TTL.
 * 🟡 Fix: Company data is now persisted across sessions with shorter TTL.
 */

export class GoogleSheetsBufferManager {
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
        return new Promise((resolve) => {
            chrome.storage.local.get([this.storageKey], (result) => {
                const entry = result[this.storageKey];
                if (!entry) return resolve(null);
                const { data, timestamp } = entry;
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
        return new Promise((resolve) => {
            chrome.storage.local.set(
                { [this.storageKey]: { data, timestamp: Date.now() } },
                resolve
            );
        });
    }

    /** Invalidate the cache entry. */
    async clear() {
        return new Promise((resolve) => {
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
        return new Promise((resolve) => {
            chrome.storage.local.get([this.storageKey], (result) => {
                const entry = result[this.storageKey];
                if (!entry) return resolve(null);
                resolve(Math.floor((Date.now() - entry.timestamp) / 1000));
            });
        });
    }
}
