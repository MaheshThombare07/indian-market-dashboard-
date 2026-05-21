const { getNiftyData } = require('./nseService');
const { getBseData } = require('./bseService');
const { fetchAllGlobalQuotes } = require('./yahooFinanceService');
const { fetchAllCommodities } = require('./commoditiesService');
const cache = require('../middleware/cacheInstance');
const { isMarketOpen, msUntilNextOpen } = require('../utils/marketHours');

const LIVE_INTERVAL_OPEN = 5_000;
const GLOBAL_INTERVAL_OPEN = 15_000;
const CHECK_INTERVAL_CLOSED = 60_000;

let niftyTimer = null;
let globalTimer = null;
let commoditiesTimer = null;
let isPolling = false;
let nseFetching = false;    // lock: skip a cycle if NSE is slow
let consecutiveNseErrs = 0; // circuit-breaker: back off on repeated failures

// ── NIFTY + BSE poller (same 5 s cycle, same NSE endpoint) ─
async function fetchNseData() {
  if (nseFetching) return; // skip if previous cycle still in-flight
  nseFetching = true;
  try {
    const [nifty, bse] = await Promise.all([
      getNiftyData().catch((err) => { console.error('[Poller:Nifty]', err.message); return null; }),
      getBseData().catch((err) => { console.error('[Poller:Bse]', err.message); return null; }),
    ]);
    if (nifty) cache.set('nifty_indices', { data: nifty, fetchedAt: new Date().toISOString() });
    if (bse)   cache.set('bse_indices',   { data: bse,   fetchedAt: new Date().toISOString() });
    if (nifty || bse) consecutiveNseErrs = 0; else consecutiveNseErrs++;
  } catch (err) {
    consecutiveNseErrs++;
  } finally {
    nseFetching = false;
  }
}

function scheduleNifty() {
  if (isMarketOpen()) {
    const interval = consecutiveNseErrs >= 5
      ? CHECK_INTERVAL_CLOSED
      : LIVE_INTERVAL_OPEN;
    fetchNseData();
    niftyTimer = setTimeout(scheduleNifty, interval);
  } else {
    niftyTimer = setTimeout(scheduleNifty, CHECK_INTERVAL_CLOSED);
  }
}

// ── Global poller ─────────────────────────────────────────
async function fetchGlobal() {
  try {
    const rawData = await fetchAllGlobalQuotes();
    const data = rawData.map((q) => ({
      id: q.symbol.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: q.name,
      base: q.previousClose ?? q.last,
      last: q.last,
      change: q.change,
      percentChange: q.percentChange,
      previousClose: q.previousClose,
      chg: { today: q.percentChange ?? 0 },
    }));
    cache.set('global_indices', { data, fetchedAt: new Date().toISOString() });
    console.log(`[Poller:Global] Cached ${data.length} indices`);
  } catch (err) {
    console.error('[Poller:Global]', err.message);
  }
}

function scheduleGlobal() {
  if (isMarketOpen()) {
    fetchGlobal();
    globalTimer = setTimeout(scheduleGlobal, GLOBAL_INTERVAL_OPEN);
  } else {
    globalTimer = setTimeout(scheduleGlobal, CHECK_INTERVAL_CLOSED);
  }
}

// ── Commodities poller ─────────────────────────────────────
async function fetchCommodities() {
  try {
    const rawData = await fetchAllCommodities();
    const data = rawData
      .filter((c) => c.last != null)
      .map((c) => ({
        name: c.name,
        last: c.last,
        previousClose: c.previousClose,
        change: c.change,
        percentChange: c.percentChange,
        chg: { today: c.percentChange ?? 0 },
      }));
    cache.set('commodities_data', { data, fetchedAt: new Date().toISOString() });
    console.log(`[Poller:Commodities] Cached ${data.length} items`);
  } catch (err) {
    console.error('[Poller:Commodities]', err.message);
  }
}

function scheduleCommodities() {
  if (isMarketOpen()) {
    fetchCommodities();
    commoditiesTimer = setTimeout(scheduleCommodities, GLOBAL_INTERVAL_OPEN);
  } else {
    commoditiesTimer = setTimeout(scheduleCommodities, CHECK_INTERVAL_CLOSED);
  }
}

// ── Start / stop ──────────────────────────────────────────
function startPolling() {
  if (niftyTimer || globalTimer) return;
  console.log('[Poller] Starting NIFTY + Global + Commodities pollers…');

  // Immediate first fetch for all data sources
  Promise.all([fetchNseData(), fetchGlobal(), fetchCommodities()]).finally(() => {
    scheduleNifty();
    scheduleGlobal();
    scheduleCommodities();
    isPolling = true;
    console.log('[Poller] Polling active');
  });
}

function stopPolling() {
  if (niftyTimer) { clearTimeout(niftyTimer); niftyTimer = null; }
  if (globalTimer) { clearTimeout(globalTimer); globalTimer = null; }
  if (commoditiesTimer) { clearTimeout(commoditiesTimer); commoditiesTimer = null; }
  isPolling = false;
  console.log('[Poller] Stopped');
}

module.exports = { startPolling, stopPolling };
