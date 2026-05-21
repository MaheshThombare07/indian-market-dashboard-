const axios = require('axios');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

const COMMODITY_MAP = {
  'Gold /oz':     'GC=F',
  'Silver /oz':   'SI=F',
  'Brent Crude':  'BZ=F',
  'WTI Crude':    'CL=F',
  'Natural Gas':  'NG=F',
};

async function fetchCommodityQuote(symbol) {
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

async function fetchAllCommodities() {
  const entries = Object.entries(COMMODITY_MAP);
  const results = [];

  for (const [name, symbol] of entries) {
    try {
      const q = await fetchCommodityQuote(symbol);
      results.push({
        name,
        last: parseFloat(q.last.toFixed(2)),
        previousClose: parseFloat(q.previousClose.toFixed(2)),
        change: parseFloat(q.change.toFixed(2)),
        percentChange: parseFloat(q.percentChange.toFixed(2)),
      });
    } catch (err) {
      console.warn(`[Commodities] Yahoo Finance failed for ${name}: ${err.message}`);
      results.push({ name, last: null, previousClose: null, change: null, percentChange: null });
    }
  }

  return results;
}

module.exports = { fetchAllCommodities, COMMODITY_MAP };
