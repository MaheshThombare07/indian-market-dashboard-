/**
 * GET /api/bonds
 *
 * Returns bond yields:
 *   - Indian Gsec (static/cached)
 *   - US Treasuries (live via Yahoo Finance)
 *
 * Cache TTL: 5 min (bonds move slowly)
 *
 * Response:
 * ```json
 * {
 *   "status": "ok",
 *   "data": [
 *     { "name": "India 10Y Gsec", "yield": 7.22, "note": "Cached", "isLive": false },
 *     { "name": "US 10Y Treasury", "yield": 4.50, "changeBp": 2, "note": "+2 bp", "isLive": true }
 *   ],
 *   "fetchedAt": "..."
 * }
 * ```
 */

const express = require('express');
const router = express.Router();
const { fetchAllBonds } = require('../services/bondsService');
const cache = require('../middleware/cacheInstance');

const CACHE_KEY = 'bonds_data';
const CACHE_TTL = 300_000; // 5 minutes

router.get('/', async (req, res, next) => {
  try {
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const raw = await fetchAllBonds();
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
