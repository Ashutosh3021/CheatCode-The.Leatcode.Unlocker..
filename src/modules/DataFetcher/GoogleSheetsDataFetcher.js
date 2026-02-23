/**
 * GoogleSheetsDataFetcher
 * Fetches rows from Google Sheets via a Cloudflare Worker proxy.
 *
 * 🔴 Fix: No API key in extension source — proxy handles auth.
 * 🔴 Fix: isFetching is ALWAYS reset in a finally block.
 * 🟡 Fix: fetchAll() batch-fetches all rows in one request (no per-row calls).
 */

import { SHEETS_CONFIG } from '../Objects.js';

export class GoogleSheetsDataFetcher {
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
