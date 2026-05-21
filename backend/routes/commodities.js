const express = require('express');
const router = express.Router();
const { fetchAllCommodities } = require('../services/commoditiesService');
const cache = require('../middleware/cacheInstance');

const CACHE_KEY = 'commodities_data';
const CACHE_TTL = 15_000;

router.get('/', async (req, res, next) => {
  try {
    let cached = cache.get(CACHE_KEY);

    if (!cached) {
      const raw = await fetchAllCommodities();
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
