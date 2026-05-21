const { nseGet } = require('./nseClient');

const NIFTY_INDEX_KEYS = [
  'NIFTY 50', 'NIFTY NEXT 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500',
  'NIFTY MIDCAP 100', 'NIFTY SMALLCAP 100', 'NIFTY BANK',
  'NIFTY AUTO', 'NIFTY FINANCIAL SERVICES', 'NIFTY FMCG', 'NIFTY IT',
  'NIFTY MEDIA', 'NIFTY METAL', 'NIFTY PHARMA', 'NIFTY REALTY',
  'NIFTY CONSUMER DURABLES', 'NIFTY OIL AND GAS', 'NIFTY HEALTHCARE INDEX',
  'NIFTY PRIVATE BANK', 'NIFTY PSU BANK', 'NIFTY INFRASTRUCTURE',
  'NIFTY ENERGY', 'NIFTY COMMODITIES', 'NIFTY INDIA CONSUMPTION',
  'NIFTY INDIA MANUFACTURING', 'NIFTY INDIA DIGITAL',
  'NIFTY MIDSMALLCAP 400', 'NIFTY TOTAL MARKET', 'NIFTY MIDSMA 400',
];

async function getNiftyData() {
  const result = await nseGet('/api/allIndices');
  const indices = result?.data || [];
  return indices
    .filter((idx) => NIFTY_INDEX_KEYS.includes(idx.index))
    .map((idx) => ({
      key: idx.index,
      name: idx.index,
      last: idx.last,
      change: idx.change,
      percentChange: idx.percentChange,
      open: idx.open,
      high: idx.high,
      low: idx.low,
      previousClose: idx.previousClose,
      timestamp: idx.timestamp,
      oneWeekAgoVal: idx.oneWeekAgoVal,
      oneMonthAgoVal: idx.oneMonthAgoVal,
      perChange30d: idx.perChange30d,
    }));
}

module.exports = { getNiftyData };
