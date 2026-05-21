/**
 * GET /api/nifty — live NIFTY data.
 *
 * The NSE `/api/allIndices` endpoint already includes oneWeekAgoVal,
 * oneMonthAgoVal, and perChange30d, so we embed chg values for all
 * periods in a single response — no separate history endpoint needed.
 */

const express = require('express');
const router = express.Router();
const { getNiftyData } = require('../services/nseService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, getMarketStatus } = require('../utils/marketHours');

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
 * Calculate historical percentage changes using fields that NSE
 * already gives us on the allIndices endpoint:
 *   - oneWeekAgoVal  →  5-day change: (last − 1wAgo) / 1wAgo × 100
 *   - oneMonthAgoVal →  1-month change
 *   - perChange30d   →  pre-calculated 30-day %
 */
function calcChanges(idx) {
  const chg = { today: idx.percentChange ?? 0 };

  if (idx.oneWeekAgoVal != null && idx.oneWeekAgoVal !== 0) {
    chg['5days'] = parseFloat((((idx.last - idx.oneWeekAgoVal) / idx.oneWeekAgoVal) * 100).toFixed(2));
  }
  if (idx.perChange30d != null) {
    chg['1month'] = parseFloat(idx.perChange30d.toFixed(2));
  } else if (idx.oneMonthAgoVal != null && idx.oneMonthAgoVal !== 0) {
    chg['1month'] = parseFloat((((idx.last - idx.oneMonthAgoVal) / idx.oneMonthAgoVal) * 100).toFixed(2));
  }

  // `yesterday` is not derivable from a single snapshot → frontend
  // falls back to static data for that tab.
  return chg;
}

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
    chg: calcChanges(idx),
  }));
}

router.get('/', async (req, res, next) => {
  try {
    const raw = req.query.raw === 'true';
    const CACHE_KEY = 'nifty_indices';
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const rawData = await getNiftyData();
      cached = { data: rawData, fetchedAt: new Date().toISOString() };
      cache.set(CACHE_KEY, cached);
    }

    res.json({
      status: 'ok',
      marketOpen: isMarketOpen(),
      marketStatus: getMarketStatus().label,
      data: raw ? cached.data : reshape(cached.data),
      fetchedAt: cached.fetchedAt,
    });
  } catch (err) {
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
