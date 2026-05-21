/**
 * NSE data service.
 *
 * NSE blocks requests without valid browser-like headers and a session
 * cookie. We simulate a two-step handshake:
 *   1. GET the NSE homepage to obtain the session cookie.
 *   2. Use that cookie on the actual API call.
 *
 * The service caches the cookie jar so we don't hit the homepage on
 * every request.  If the API call returns a 403/40x we re-fetch the
 * cookie and retry once.
 */

const axios = require('axios');
const https = require('https');

// ── Config ────────────────────────────────────────────────
const NSE_BASE = process.env.NSE_API_BASE || 'https://www.nseindia.com';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache',
};

// ── Cookie management ─────────────────────────────────────
let cookieJar = null;
let cookieExpiry = 0;
const COOKIE_TTL = 10 * 60 * 1000; // 10 minutes

/** Fetch a fresh session cookie from the NSE homepage. */
async function refreshCookie() {
  const res = await axios.get(NSE_BASE, {
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 10_000,
  });

  const setCookie = res.headers['set-cookie'];
  if (!setCookie) {
    throw new Error('NSE did not return a session cookie');
  }

  // Extract the raw cookie string(s)
  cookieJar = Array.isArray(setCookie)
    ? setCookie.map(c => c.split(';')[0]).join('; ')
    : setCookie.split(';')[0];

  cookieExpiry = Date.now() + COOKIE_TTL;
}

/** Return a valid cookie, refreshing if necessary. */
async function getCookie() {
  if (!cookieJar || Date.now() > cookieExpiry) {
    await refreshCookie();
  }
  return cookieJar;
}

// ── Data fetching ─────────────────────────────────────────

/** NSE index keys that belong to NIFTY broad & sectoral family. */
const NIFTY_INDEX_KEYS = [
  'NIFTY 50',
  'NIFTY NEXT 50',
  'NIFTY 100',
  'NIFTY 200',
  'NIFTY 500',
  'NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 100',
  'NIFTY BANK',
  'NIFTY AUTO',
  'NIFTY FINANCIAL SERVICES',
  'NIFTY FMCG',
  'NIFTY IT',
  'NIFTY MEDIA',
  'NIFTY METAL',
  'NIFTY PHARMA',
  'NIFTY REALTY',
  'NIFTY CONSUMER DURABLES',
  'NIFTY OIL AND GAS',
  'NIFTY HEALTHCARE INDEX',
  'NIFTY PRIVATE BANK',
  'NIFTY PSU BANK',
  'NIFTY INFRASTRUCTURE',
  'NIFTY ENERGY',
  'NIFTY COMMODITIES',
  'NIFTY INDIA CONSUMPTION',
  'NIFTY INDIA MANUFACTURING',
  'NIFTY INDIA DIGITAL',
  'NIFTY MIDSMALLCAP 400',
  'NIFTY TOTAL MARKET',
  'NIFTY MIDSMA 400',
];

/**
 * Fetch all indices from NSE, then filter down to NIFTY family.
 * Returns a flat array of { name, value, change, percentChange, ... }.
 */
async function fetchNiftyIndices() {
  const cookie = await getCookie();

  const res = await axios.get(`${NSE_BASE}/api/allIndices`, {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookie,
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 15_000,
  });

  const indices = res.data?.data || [];
  return indices
    .filter((idx) => NIFTY_INDEX_KEYS.includes(idx.index))
    .map((idx) => ({
      key: idx.index,
      name: idx.index,
      last: idx.last,
      change: idx.change,
      percentChange: idx.percentChange,
      open: idx.open,
      high: idx.high,
      low: idx.low,
      previousClose: idx.previousClose,
      timestamp: idx.timestamp,
    }));
}

/**
 * Public wrapper — handles cookie refresh & retry on auth failure.
 */
async function getNiftyData() {
  try {
    return await fetchNiftyIndices();
  } catch (err) {
    // If 403 / 40x → cookie likely stale; refresh & retry once
    if (err.response && err.response.status >= 400 && err.response.status < 500) {
      console.warn('[NSE] Auth failure, refreshing cookie…');
      cookieJar = null;
      return await fetchNiftyIndices();
    }
    throw err;
  }
}

module.exports = { getNiftyData };
