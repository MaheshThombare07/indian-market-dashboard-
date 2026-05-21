/**
 * GET /api/global
 *
 * Returns live data for global indices from Yahoo Finance.
 *
 * Query params:
 *   ?raw=true  — return the full Yahoo Finance response
 *
 * Response:
 * ```json
 * {
 *   "status": "ok",
 *   "data": [ { name, symbol, last, change, percentChange, ... } ],
 *   "fetchedAt": "..."
 * }
 * ```
 */

const express = require('express');
const router = express.Router();
const { fetchAllGlobalQuotes } = require('../services/yahooFinanceService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, getMarketStatus } = require('../utils/marketHours');

const CACHE_KEY = 'global_indices';
const CACHE_TTL = 15_000; // 15 seconds

router.get('/', async (req, res, next) => {
  try {
    const raw = req.query.raw === 'true';
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const rawData = await fetchAllGlobalQuotes();
      cached = {
        data: raw ? rawData : reshape(rawData),
        fetchedAt: new Date().toISOString(),
      };
      cache.set(CACHE_KEY, cached, CACHE_TTL);
    }

    res.json({
      status: 'ok',
      marketStatus: getMarketStatus().label,
      ...cached,
    });
  } catch (err) {
    const fallback = cache.get(CACHE_KEY);
    if (fallback) {
      return res.json({ status: 'stale', ...fallback });
    }
    next(err);
  }
});

/**
 * Reshape Yahoo Finance data into the same shape IndexRow.jsx expects:
 *   { id, name, base (≙ last), chg: { today: percentChange } }
 */
function reshape(rawData) {
  return rawData.map((q) => ({
    id: q.symbol.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: q.name,
    base: q.previousClose ?? q.last,
    last: q.last,
    change: q.change,
    percentChange: q.percentChange,
    previousClose: q.previousClose,
    chg: { today: q.percentChange ?? 0 },
  }));
}

module.exports = router;
