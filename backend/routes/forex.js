/**
 * GET /api/forex
 *
 * Returns live forex rates for 8 major INR pairs.
 *
 * Cache TTL: 60 s (refreshed on each request when stale)
 *
 * Response:
 * ```json
 * {
 *   "status": "ok" | "stale",
 *   "data": [
 *     { "pair": "USD/INR", "val": 83.2012, "change": 0.0512, "percentChange": 0.06 }
 *   ],
 *   "fetchedAt": "ISO timestamp"
 * }
 * ```
 */

const express = require('express');
const router = express.Router();
const { fetchAllForex } = require('../services/forexService');
const cache = require('../middleware/cacheInstance');

const CACHE_KEY = 'forex_data';
const CACHE_TTL = 60_000; // 60 seconds

router.get('/', async (req, res, next) => {
  try {
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const raw = await fetchAllForex();
      cached = { data: raw, fetchedAt: new Date().toISOString() };
      cache.set(CACHE_KEY, cached, CACHE_TTL);
    }

    res.json({ status: 'ok', ...cached });
  } catch (err) {
    const fallback = cache.get(CACHE_KEY);
    if (fallback) {
      return res.json({ status: 'stale', ...fallback });
    }
    next(err);
  }
});

module.exports = router;
