/**
 * Forex data service.
 *
 * Fetches live INR forex pair rates from Yahoo Finance.
 * Falls back to the previous cached value when a symbol fails.
 *
 * Strategy:
 *   - 8 major INR pairs fetched sequentially (to avoid rate limiting)
 *   - Each fetch uses Yahoo Finance chart API (no API key)
 *   - Returns 4–5 decimal precision for small pairs like JPY/INR
 *   - percentChange is the real daily % change from Yahoo Finance
 */

const axios = require('axios');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/** Yahoo Finance symbols for each forex pair */
const FOREX_MAP = {
  'USD/INR': 'USDINR=X',
  'EUR/INR': 'EURINR=X',
  'GBP/INR': 'GBPINR=X',
  'JPY/INR': 'JPYINR=X',
  'AED/INR': 'AEDINR=X',
  'SGD/INR': 'SGDINR=X',
  'CHF/INR': 'CHFINR=X',
  'CAD/INR': 'CADINR=X',
};

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

/**
 * Fetch a single forex quote from Yahoo Finance.
 * Returns raw { last, change, percentChange, previousClose }.
 */
async function fetchForexQuote(symbol) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await axios.get(url, { headers: REQUEST_HEADERS, timeout: 10_000 });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for symbol ${symbol}`);

  const meta = result.meta || {};
  const closes = result.indicators?.quote?.[0]?.close || [];

  const last = meta.regularMarketPrice ?? closes[closes.length - 1] ?? meta.chartPreviousClose;
  const previousClose = meta.previousClose ?? closes[closes.length - 2] ?? meta.chartPreviousClose;
  const change = last - previousClose;
  const percentChange = previousClose ? (change / previousClose) * 100 : 0;

  return { last, change, percentChange, previousClose };
}

/** Determine decimal precision based on the pair magnitude */
function getPrecision(pair) {
  if (pair.startsWith('JPY')) return 5;
  if (pair.startsWith('CHF')) return 5;
  return 4;
}

/**
 * Fetch all 8 forex pairs sequentially.
 * Returns an array of { pair, val, change, percentChange }.
 */
async function fetchAllForex() {
  const entries = Object.entries(FOREX_MAP);
  const results = [];
  const errors = [];

  for (const [pair, symbol] of entries) {
    try {
      const q = await fetchForexQuote(symbol);
      const prec = getPrecision(pair);
      results.push({
        pair,
        val: parseFloat(q.last.toFixed(prec)),
        change: parseFloat(q.change.toFixed(prec)),
        percentChange: parseFloat(q.percentChange.toFixed(2)),
      });
    } catch (err) {
      errors.push({ pair, message: err.message });
      // Still push a null entry so the route knows it failed
      results.push({ pair, val: null, change: null, percentChange: null });
    }
  }

  if (errors.length > 0) {
    console.warn(`[Forex] ${errors.length}/${entries.length} pair(s) failed:`, errors.map(e => e.pair).join(', '));
  }

  return results;
}

module.exports = { fetchAllForex, FOREX_MAP };
