const axios = require('axios');
const https = require('https');

const NSE_BASE = process.env.NSE_API_BASE || 'https://www.nseindia.com';

// Shared keepAlive agent — prevents socket exhaustion from creating
// a new Agent on every 5-second poll cycle
const SHARED_AGENT = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 8,
});

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

let cookieJar = null;
let cookieExpiry = 0;
const COOKIE_TTL = 10 * 60 * 1000;

const MAX_RETRIES = 2;

/** Sleep helper */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function refreshCookie() {
  try {
    const res = await axios.get(NSE_BASE, {
      headers: {
        ...BROWSER_HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      httpsAgent: SHARED_AGENT,
      timeout: 10_000,
    });

    const setCookie = res.headers['set-cookie'];
    if (!setCookie) throw new Error('NSE did not return a session cookie');
    cookieJar = Array.isArray(setCookie)
      ? setCookie.map(c => c.split(';')[0]).join('; ')
      : setCookie.split(';')[0];
    cookieExpiry = Date.now() + COOKIE_TTL;
    console.log('[nseClient] Cookie refreshed');
  } catch (err) {
    // Don't clear a still-valid cookie on transient errors
    console.error('[nseClient] Cookie refresh failed:', err.code || err.message);
    throw err;
  }
}

async function getCookie() {
  if (!cookieJar || Date.now() > cookieExpiry) await refreshCookie();
  return cookieJar;
}

async function nseGet(path, timeout = 15_000) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const cookie = await getCookie();
      const res = await axios.get(`${NSE_BASE}${path}`, {
        headers: { ...BROWSER_HEADERS, Cookie: cookie },
        httpsAgent: SHARED_AGENT,
        timeout,
      });
      return res.data;
    } catch (err) {
      const code = err.code || '';
      const status = err.response?.status;

      // 4xx → expired cookie, clear and retry once
      if (status && status >= 400 && status < 500) {
        console.warn(`[nseClient] ${status} on ${path} — refreshing cookie`);
        cookieJar = null;
        if (attempt < MAX_RETRIES) {
          await sleep(500);
          continue;
        }
      }

      // Network errors (ECONNRESET, ETIMEDOUT, etc.) → retry with backoff
      if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
        console.warn(`[nseClient] ${code} on ${path} (attempt ${attempt}/${MAX_RETRIES})`);
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
      }

      // Last resort — log and rethrow
      console.error(`[nseClient] ${code || err.message} on ${path} after ${MAX_RETRIES} attempt(s)`);
      throw err;
    }
  }
}

module.exports = { nseGet };
