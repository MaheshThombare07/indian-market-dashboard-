/**
 * Yahoo Finance data service (unofficial API).
 *
 * Uses the public Yahoo Finance chart API — no API key required.
 *
 * Endpoint: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
 *
 * We use `range=5d&interval=1d` to get the latest close plus
 * prior close so we can compute daily % change.
 */

const axios = require('axios');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Map our front-end index names to Yahoo Finance symbols.
 */
const SYMBOL_MAP = {
  'NASDAQ':          '^IXIC',
  'S&P 500':         '^GSPC',
  'Dow Jones':       '^DJI',
  'DAX (Germany)':   '^GDAXI',
  'FTSE 100 (UK)':   '^FTSE',
  'CAC 40 (France)': '^FCHI',
  'Nikkei 225':      '^N225',
  'ASX 200':         '^AXJO',
  'KOSPI (Korea)':   '^KS11',
  'SGX Nifty':       '^NIFTY',
  'Hang Seng':       '^HSI',
  'Shanghai Comp':   '000001.SS',
};

/**
 * Reverse map symbol → front-end name.
 */
const SYMBOL_TO_NAME = {};
for (const [name, sym] of Object.entries(SYMBOL_MAP)) {
  SYMBOL_TO_NAME[sym] = name;
}

function getSymbol(name) {
  return SYMBOL_MAP[name];
}

/**
 * Fetch quote data for a single symbol from Yahoo Finance.
 * Returns { name, symbol, last, change, percentChange, previousClose, marketState }.
 */
async function fetchQuote(symbol) {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    timeout: 10_000,
  });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for symbol ${symbol}`);

  const meta = result.meta || {};
  const quotes = result.indicators?.quote?.[0] || {};
  const closes = quotes.close || [];
  const opens = quotes.open || [];
  const timestamps = result.timestamp || [];

  // Use regularMarketPrice for the CURRENT price (not the last completed close).
  // This gives correct live percentChange when markets are open.
  const last = meta.regularMarketPrice ?? closes[closes.length - 1] ?? meta.chartPreviousClose;
  const previousClose = meta.previousClose ?? closes[closes.length - 2] ?? meta.chartPreviousClose;
  const open = meta.regularMarketOpen ?? opens[opens.length - 1] ?? last;

  const change = last - previousClose;
  const percentChange = previousClose ? (change / previousClose) * 100 : 0;

  // Determine market state
  const now = Date.now() / 1000;
  const lastTime = timestamps[timestamps.length - 1] || 0;
  const marketState = (now - lastTime) < 86400 ? 'OPEN' : 'CLOSED'; // within 24h

  return {
    name: SYMBOL_TO_NAME[symbol] || symbol,
    symbol,
    last: parseFloat(last.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    percentChange: parseFloat(percentChange.toFixed(2)),
    open: open ? parseFloat(open.toFixed(2)) : null,
    previousClose: parseFloat(previousClose.toFixed(2)),
    marketState,
    timestamp: new Date(lastTime * 1000).toISOString(),
  };
}

/**
 * Fetch quotes for all configured global indices.
 * Returns an array of quote objects.
 */
async function fetchAllGlobalQuotes() {
  const symbols = Object.values(SYMBOL_MAP);
  const results = [];
  const errors = [];

  const queue = [...symbols];
  const CONCURRENCY = 6;

  async function worker() {
    while (queue.length > 0) {
      const sym = queue.shift();
      try {
        const quote = await fetchQuote(sym);
        results.push(quote);
      } catch (err) {
        errors.push({ symbol: sym, message: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (errors.length > 0) {
    console.warn(`[YahooFinance] ${errors.length} symbol(s) failed:`, errors.map(e => e.symbol).join(', '));
  }

  return results;
}

module.exports = { fetchAllGlobalQuotes, SYMBOL_MAP };
