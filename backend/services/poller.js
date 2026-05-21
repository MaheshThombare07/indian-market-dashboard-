/**
 * Polling manager.
 *
 * During market hours the poller fetches NSE data every 5 seconds
 * and writes it into the shared cache.  When the market closes it
 * stops and schedules a wake-up for the next open.
 */

const { getNiftyData } = require('./nseService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, msUntilNextOpen } = require('../utils/marketHours');

const CACHE_KEY = 'nifty_indices';
let pollTimer = null;
let isPolling = false;

const POLL_INTERVAL_OPEN = 5_000;  // 5 seconds when market is open
const POLL_INTERVAL_CLOSED = 60_000; // 1 minute check when closed

/**
 * Single fetch → cache update.
 */
async function fetchAndCache() {
  try {
    const rawData = await getNiftyData();
    const data = {
      data: rawData,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(CACHE_KEY, data);
    console.log(`[Poller] Cached ${rawData.length} indices at ${data.fetchedAt}`);
  } catch (err) {
    console.error('[Poller] Fetch failed:', err.message);
  }
}

/**
 * Polling loop — decides the next tick interval based on market state.
 */
function tick() {
  if (isMarketOpen()) {
    fetchAndCache();
    pollTimer = setTimeout(tick, POLL_INTERVAL_OPEN);
    if (!isPolling) {
      isPolling = true;
      console.log('[Poller] Market OPEN — polling every 5 s');
    }
  } else {
    if (isPolling) {
      isPolling = false;
      const ms = msUntilNextOpen();
      const min = Math.round(ms / 60_000);
      console.log(`[Poller] Market CLOSED — next check in ${min} min`);
    }
    // Still check periodically so we resume quickly after open
    pollTimer = setTimeout(tick, POLL_INTERVAL_CLOSED);
  }
}

/** Start the poller. */
function startPolling() {
  if (pollTimer) return;
  console.log('[Poller] Starting…');
  // Immediate first fetch
  fetchAndCache().finally(() => {
    tick();
  });
}

/** Stop the poller cleanly. */
function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  isPolling = false;
  console.log('[Poller] Stopped');
}

module.exports = { startPolling, stopPolling };
