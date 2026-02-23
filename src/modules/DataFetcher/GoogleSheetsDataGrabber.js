/**
 * GoogleSheetsDataGrabber
 * High-level orchestrator: checks buffer first, fetches from Sheets on miss.
 * Wraps GoogleSheetsDataFetcher + GoogleSheetsBufferManager.
 *
 * 🟡 Fix: Company data persisted with 24h TTL (was lost between sessions).
 */

import { GoogleSheetsDataFetcher } from './GoogleSheetsDataFetcher.js';
import { GoogleSheetsBufferManager } from '../BufferManager/GoogleSheetsBufferManager.js';
import { SHEETS, STORAGE_KEYS, TTL } from '../Objects.js';

const fetcher = new GoogleSheetsDataFetcher();

// Each data type gets its own buffer with appropriate TTL
const buffers = {
    [SHEETS.PROBLEM_DATA]: new GoogleSheetsBufferManager(STORAGE_KEYS.PROBLEM_DATA, TTL.TWO_WEEKS),
    [SHEETS.COMPANY_TAGS]: new GoogleSheetsBufferManager(STORAGE_KEYS.COMPANY_DATA, TTL.ONE_DAY), // 🟡 24h
    [SHEETS.EDITORIALS]: new GoogleSheetsBufferManager(STORAGE_KEYS.EDITORIAL, TTL.TWO_WEEKS),
    [SHEETS.TOP_PROBLEMS]: new GoogleSheetsBufferManager(STORAGE_KEYS.TOP_PROBLEMS, TTL.TWO_WEEKS),
};

export class GoogleSheetsDataGrabber {
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
