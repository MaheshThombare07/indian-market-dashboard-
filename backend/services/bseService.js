/**
 * BSE / Sensex data service.
 *
 * Fetches BSE index data from **Yahoo Finance** — the NSE `/api/allIndices`
 * endpoint only returns NIFTY indices, not BSE/SENSEX.
 *
 * Yahoo Finance symbols for BSE indices:
 *   ✓ ^BSESN    → SENSEX
 *   ✓ ^BSEBANK  → BSE BANKEX
 *   ✓ ^BSEFMCG  → BSE FMCG
 *   ✓ ^BSEIT    → BSE IT
 *   ✓ ^BSEHC    → BSE HEALTHCARE
 *   ✗ ^BSECG    → BSE CAP GOODS   (static fallback — unreliable on YF)
 *   ✗ ^BSEPOWER → BSE POWER      (not on Yahoo Finance → static fallback)
 *   ✗ ^BSEMID   → BSE MIDCAP     (not on Yahoo Finance → static fallback)
 *   ✗ ^BSESML   → BSE SMALLCAP   (not on Yahoo Finance → static fallback)
 */

const axios = require('axios');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

/** Yahoo Finance symbols for BSE indices */
const BSE_SYMBOL_MAP = {
  'SENSEX':         '^BSESN',
  'BSE Bankex':     '^BSEBANK',
  'BSE FMCG':       '^BSEFMCG',
  'BSE IT':         '^BSEIT',
  'BSE Healthcare': '^BSEHC',
};

/** Static baseline for ALL BSE indices — Yahoo Finance overlays live data */
const ALL_INDICES = [
  { name: 'SENSEX',         last: 79250,   previousClose: 79250, percentChange: null },
  { name: 'BSE Bankex',     last: 59900,   previousClose: 59900, percentChange: null },
  { name: 'BSE Cap Goods',  last: 68500,   previousClose: 68500, percentChange: null },
  { name: 'BSE FMCG',       last: 21800,   previousClose: 21800, percentChange: null },
  { name: 'BSE IT',         last: 39200,   previousClose: 39200, percentChange: null },
  { name: 'BSE Healthcare', last: 42100,   previousClose: 42100, percentChange: null },
  { name: 'BSE Power',      last: 8259.04, previousClose: 8200,  percentChange: null },
  { name: 'BSE Midcap',     last: 40589,   previousClose: 40500, percentChange: null },
  { name: 'BSE Smallcap',   last: 17568,   previousClose: 17550, percentChange: null },
];

async function fetchBseQuote(symbol) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await axios.get(url, { headers: REQUEST_HEADERS, timeout: 10_000 });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for symbol ${symbol}`);

  const meta = result.meta || {};
  const closes = result.indicators?.quote?.[0]?.close || [];

  const last = meta.regularMarketPrice ?? closes[closes.length - 1] ?? meta.chartPreviousClose;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? closes[closes.length - 2];

  if (last == null || previousClose == null) {
    throw new Error(`Null price data for ${symbol} (last=${last}, prevClose=${previousClose})`);
  }

  const change = last - previousClose;
  const percentChange = previousClose ? (change / previousClose) * 100 : 0;

  return { last, previousClose, change, percentChange };
}

/**
 * Fetch BSE index data.
 *
 * Starts with a static baseline for all 9 indices, then overlays
 * live data from Yahoo Finance for indices that resolve successfully.
 * Indices that fail (pre‑market null prices, unknown symbols) keep
 * their static values — the front end never sees gaps.
 */
async function getBseData() {
  const liveByName = new Map();

  // Overlay live data from Yahoo Finance
  for (const [name, symbol] of Object.entries(BSE_SYMBOL_MAP)) {
    try {
      const q = await fetchBseQuote(symbol);
      liveByName.set(name, {
        last: parseFloat(q.last.toFixed(2)),
        previousClose: parseFloat(q.previousClose.toFixed(2)),
        percentChange: parseFloat(q.percentChange.toFixed(2)),
      });
    } catch (err) {
      console.warn(`[BSE] Yahoo Finance failed for ${name}: ${err.message}`);
    }
  }

  // Build result: static baseline → overlaid with live
  return ALL_INDICES.map((base) => {
    const live = liveByName.get(base.name);
    if (!live) return { ...base };
    return {
      name: base.name,
      last: live.last,
      previousClose: live.previousClose,
      percentChange: live.percentChange,
    };
  });
}

module.exports = { getBseData };
