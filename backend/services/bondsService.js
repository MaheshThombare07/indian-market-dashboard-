/**
 * Bonds & Treasury service.
 *
 * US Treasury yields are fetched live from Yahoo Finance.
 * Indian Gsec yields are served as static data (no reliable free API).
 *
 * Yahoo Finance bond symbols:
 *   ^TNX  – US 10Y Treasury yield
 *   ^FVX  – US 5Y Treasury yield
 *
 * The 2Y Treasury has no direct Yahoo Finance symbol, so it uses
 * a cached static value as well.
 */

const axios = require('axios');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/** US Treasury symbols available on Yahoo Finance */
const US_BOND_MAP = {
  'US 10Y Treasury': '^TNX',
  'US 5Y Treasury': '^FVX',
};

/** Indian Gsec — no free live API, served as cached static data */
const INDIAN_GSEC = [
  { name: 'India 10Y Gsec', yield: 7.22, note: 'Cached' },
  { name: 'India 5Y Gsec', yield: 7.05, note: 'Cached' },
  { name: 'India 2Y Gsec', yield: 6.90, note: 'Cached' },
  { name: 'US 2Y Treasury', yield: 4.78, note: 'Cached' },
];

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

/**
 * Fetch a bond yield quote from Yahoo Finance.
 * Returns { name, yield, change, changeBp }.
 */
async function fetchBondQuote(name, symbol) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await axios.get(url, { headers: REQUEST_HEADERS, timeout: 10_000 });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta || {};
  const closes = result.indicators?.quote?.[0]?.close || [];
  const timestamps = result.timestamp || [];

  const last = meta.regularMarketPrice ?? closes[closes.length - 1] ?? meta.chartPreviousClose;
  const previousClose = meta.previousClose ?? closes[closes.length - 2] ?? meta.chartPreviousClose;
  const change = last - previousClose;

  return {
    name,
    symbol,
    yield: parseFloat(last.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changeBp: parseFloat((change * 100).toFixed(1)),
    isLive: true,
  };
}

/**
 * Fetch all bond yields:
 *   - US Treasuries live from Yahoo Finance
 *   - Indian Gsec from static cache
 */
async function fetchAllBonds() {
  // Start with Indian Gsec (static)
  const results = INDIAN_GSEC.map((b) => ({
    name: b.name,
    yield: b.yield,
    change: null,
    changeBp: null,
    isLive: false,
    note: b.note,
  }));

  // Fetch US Treasuries live
  for (const [name, symbol] of Object.entries(US_BOND_MAP)) {
    try {
      const q = await fetchBondQuote(name, symbol);
      results.push({
        name: q.name,
        yield: q.yield,
        change: q.change,
        changeBp: q.changeBp,
        isLive: q.isLive,
        note: q.changeBp !== null && q.changeBp !== 0
          ? `${q.changeBp > 0 ? '+' : ''}${q.changeBp} bp`
          : 'Unchanged',
      });
    } catch (err) {
      console.warn(`[Bonds] Failed to fetch ${name}:`, err.message);
      results.push({
        name,
        yield: null,
        change: null,
        changeBp: null,
        isLive: false,
        note: 'Offline',
      });
    }
  }

  return results;
}

module.exports = { fetchAllBonds };
