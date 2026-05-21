/**
 * Cache singleton shared across routes & the poller.
 *
 * TTL is set high (5 min) because the poller will keep it fresh
 * during market hours.  When the market is closed stale data is
 * still served — the route handles that gracefully.
 */
const MemoryCache = require('./cache');
module.exports = new MemoryCache(300_000); // 5 min
