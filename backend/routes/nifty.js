const express = require('express');
const router = express.Router();
const { getNiftyData } = require('../services/nseService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, getMarketStatus } = require('../utils/marketHours');

/**
 * Map NSE index names to the same `id` values used in the front-end's
 * static data (n50, nau, nbk, …).  This keeps the watchlist (localStorage)
 * compatible across live and static panels.
 */
const NSE_ID_MAP = {
  'NIFTY 50': 'n50',
  'NIFTY AUTO': 'nau',
  'NIFTY BANK': 'nbk',
  'NIFTY CONSUMER DURABLES': 'ncd',
  'NIFTY ENERGY': 'nen',
  'NIFTY FINANCIAL SERVICES': 'nfin',
  'NIFTY FMCG': 'nfm',
  'NIFTY HEALTHCARE INDEX': 'nhc',
  'NIFTY INFRASTRUCTURE': 'nin',
  'NIFTY IT': 'nit',
  'NIFTY MEDIA': 'nmd2',
  'NIFTY METAL': 'nmt',
  'NIFTY MIDCAP 100': 'nmd',
  'NIFTY PHARMA': 'nph',
  'NIFTY PRIVATE BANK': 'npb',
  'NIFTY PSU BANK': 'nps',
  'NIFTY REALTY': 'nrl',
  'NIFTY SMALLCAP 100': 'nsm',
  'NIFTY OIL AND GAS': 'nen',
  'NIFTY INDIA MANUFACTURING': 'nmu',
};

function toId(nseName) {
  return NSE_ID_MAP[nseName] || nseName.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Convert the NSE service output (which uses `key` as the index name)
 * into the shape IndexRow.jsx expects.
 */
function reshape(rawData) {
  return rawData.map((idx) => ({
    id: toId(idx.key),
    name: idx.key,
    base: idx.previousClose ?? idx.last,
    last: idx.last,
    change: idx.change,
    percentChange: idx.percentChange,
    open: idx.open,
    high: idx.high,
    low: idx.low,
    previousClose: idx.previousClose,
    chg: {
      today: idx.percentChange ?? 0,
    },
  }));
}

router.get('/', async (req, res, next) => {
  try {
    const raw = req.query.raw === 'true';
    const CACHE_KEY = 'nifty_indices';

    // 1. Read cache (populated by the background poller or a previous request)
    let cached = cache.get(CACHE_KEY);

    // 2. If cache is stale / empty, fetch from NSE directly
    if (!cached) {
      const rawData = await getNiftyData();
      cached = { data: rawData, fetchedAt: new Date().toISOString() };
      cache.set(CACHE_KEY, cached);
    }

    // 3. Always reshape before returning to the front-end
    res.json({
      status: 'ok',
      marketOpen: isMarketOpen(),
      marketStatus: getMarketStatus().label,
      data: raw ? cached.data : reshape(cached.data),
      fetchedAt: cached.fetchedAt,
    });
  } catch (err) {
    // 4. Fallback — return stale cache if available
    const fallback = cache.get('nifty_indices');
    if (fallback) {
      return res.json({
        status: 'stale',
        marketOpen: isMarketOpen(),
        marketStatus: getMarketStatus().label,
        data: reshape(fallback.data),
        fetchedAt: fallback.fetchedAt,
      });
    }
    next(err);
  }
});

module.exports = router;
