/**
 * GET /api/rbi
 *
 * Returns RBI policy rates (repo, reverse repo, CRR, SLR, etc.).
 *
 * Cache TTL: 1 hour — these rates change only every 6–8 weeks.
 *
 * Response:
 * ```json
 * {
 *   "status": "ok",
 *   "data": [
 *     { "name": "RBI Repo Rate", "val": "6.50%", "note": "RBI" }
 *   ],
 *   "fetchedAt": "..."
 * }
 * ```
 */

const express = require('express');
const router = express.Router();
const { fetchRbiRates } = require('../services/rbiService');
const cache = require('../middleware/cacheInstance');

const CACHE_KEY = 'rbi_rates';
const CACHE_TTL = 3_600_000; // 1 hour

router.get('/', async (req, res, next) => {
  try {
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const raw = await fetchRbiRates();
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
