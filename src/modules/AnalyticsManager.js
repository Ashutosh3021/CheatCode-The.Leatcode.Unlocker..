/**
 * AnalyticsManager
 * Singleton — Firebase GA4 event logger.
 * Disabled by default (enableAnalytics = false in DEFAULT_SETTINGS).
 */

let instance = null;

export class AnalyticsManager {
    static getInstance() {
        if (!instance) instance = new AnalyticsManager();
        return instance;
    }

    constructor() {
        if (instance) return instance;
        this.enabled = false; // off by default
        instance = this;
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
        } catch (_) { /* fail silently */ }
    }
}
