/**
 * NSE historical data service.
 *
 * Fetches ~30 trading days of daily close data for each NIFTY index
 * and calculates percentage changes for yesterday / 5 days / 1 month.
 */

const { nseGet } = require('./nseClient');
const { getHistoryFromDate, getHistoryToDate } = require('../utils/dateUtils');

/**
 * Map NSE index names to our static IDs (same mapping as nifty route).
 */
const NSE_ID_MAP = {
  'NIFTY 50': 'n50', 'NIFTY AUTO': 'nau', 'NIFTY BANK': 'nbk',
  'NIFTY CONSUMER DURABLES': 'ncd', 'NIFTY ENERGY': 'nen',
  'NIFTY FINANCIAL SERVICES': 'nfin', 'NIFTY FMCG': 'nfm',
  'NIFTY HEALTHCARE INDEX': 'nhc', 'NIFTY INFRASTRUCTURE': 'nin',
  'NIFTY IT': 'nit', 'NIFTY MEDIA': 'nmd2', 'NIFTY METAL': 'nmt',
  'NIFTY MIDCAP 100': 'nmd', 'NIFTY PHARMA': 'nph',
  'NIFTY PRIVATE BANK': 'npb', 'NIFTY PSU BANK': 'nps',
  'NIFTY REALTY': 'nrl', 'NIFTY SMALLCAP 100': 'nsm',
  'NIFTY OIL AND GAS': 'nen', 'NIFTY INDIA MANUFACTURING': 'nmu',
};

function toId(name) {
  return NSE_ID_MAP[name] || name.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Parse NSE date string (CH_TIMESTAMP) → Date.
 * Expected format: "21-May-2026"
 */
function parseNseDate(str) {
  return new Date(str.replace(/-/g, ' '));
}

/**
 * Fetch historical close data for a single index from NSE.
 * Returns sorted array of { date: Date, close: number }.
 */
async function fetchIndexHistory(indexName) {
  const from = getHistoryFromDate();
  const to = getHistoryToDate();
  const path = `/api/historical/indicesHistory?indexType=${encodeURIComponent(indexName)}&from=${from}&to=${to}`;
  const result = await nseGet(path, 20_000);
  const rows = result?.data || [];
  return rows
    .map((r) => ({ date: parseNseDate(r.CH_TIMESTAMP), close: r.CH_CLOSINGINDEXVAL }))
    .filter((r) => r.close != null)
    .sort((a, b) => a.date - b.date);
}

/**
 * Given a sorted array of close-price records, calculate:
 *   yesterday  – % change from the day before the latest complete day to the latest complete day
 *   5days      – % change from 5 trading days before the latest complete day
 *   1month     – % change from ~22 trading days before the latest complete day
 *
 * Returns null if insufficient data.
 */
function calcChanges(records) {
  if (records.length < 3) return null;
  const n = records.length;
  const latest = records[n - 1]; // most recent close
  const prev = records[n - 2];   // day before

  // yesterday's session change: close of yesterday vs close of day before
  const yesterday = ((prev.close - records[n - 3]?.close) / records[n - 3]?.close) * 100;

  // 5 trading days ago
  const idx5 = records.findLastIndex((r, i) => i < n - 1 && n - 1 - i >= 5);
  const chg5 = idx5 >= 0 ? ((latest.close - records[idx5].close) / records[idx5].close) * 100 : null;

  // ~22 trading days ago (≈ 1 calendar month)
  const idx1m = records.findLastIndex((r, i) => i < n - 1 && n - 1 - i >= 22);
  const chg1m = idx1m >= 0 ? ((latest.close - records[idx1m].close) / records[idx1m].close) * 100 : null;

  return {
    yesterday: parseFloat(yesterday.toFixed(2)),
    '5days': chg5 != null ? parseFloat(chg5.toFixed(2)) : null,
    '1month': chg1m != null ? parseFloat(chg1m.toFixed(2)) : null,
  };
}

/**
 * Fetch historical changes for all specified index names.
 * Returns an object: { [id]: { yesterday, '5days', '1month' } }
 */
async function fetchAllHistoricalChanges(indexNames) {
  const results = {};
  const errors = [];

  // Process with concurrency limit of 3 to avoid overwhelming NSE
  const queue = [...indexNames];
  const CONCURRENCY = 3;

  async function worker() {
    while (queue.length > 0) {
      const name = queue.shift();
      try {
        const records = await fetchIndexHistory(name);
        const changes = calcChanges(records);
        if (changes) results[toId(name)] = changes;
      } catch (err) {
        errors.push({ name, message: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (errors.length > 0) {
    console.warn(`[nseHistorical] ${errors.length} index(es) failed:`, errors.slice(0, 3).map(e => e.name).join(', '));
  }

  return results;
}

module.exports = { fetchAllHistoricalChanges };
