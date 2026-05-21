/**
 * GET /api/bse — live BSE / Sensex index data.
 *
 * Data source: Yahoo Finance (^BSESN, ^BSEBANK, ^BSECG, …).
 * The NSE `/api/allIndices` endpoint does NOT include BSE indices.
 *
 * Only `chg.today` is live (from Yahoo Finance).  The `5days` and
 * `1month` periods rely on the front-end static fallback.
 */

const express = require('express');
const router = express.Router();
const { getBseData } = require('../services/bseService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, getMarketStatus } = require('../utils/marketHours');

const CACHE_KEY = 'bse_indices';

/**
 * Build chg object for the front end.
 *
 * Only set `chg.today` when percentChange is a real number — if it's
 * null (static baseline / Yahoo Finance failed) the front-end merge
 * keeps the static `chg.today` value.
 *
 * `5days` and `1month` are not available from Yahoo Finance's single
 * snapshot, so they are left undefined → front-end keeps static values.
 */
function calcChanges(idx) {
  const chg = {};
  if (idx.percentChange != null) {
    chg.today = idx.percentChange;
  }
  return chg;
}

function reshape(rawData) {
  return rawData.map((idx) => ({
    name: idx.name,
    base: idx.previousClose ?? idx.last,
    last: idx.last,
    percentChange: idx.percentChange,
    chg: calcChanges(idx),
  }));
}

router.get('/', async (req, res, next) => {
  try {
    const raw = req.query.raw === 'true';
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const rawData = await getBseData();
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
    const fallback = cache.get(CACHE_KEY);
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
