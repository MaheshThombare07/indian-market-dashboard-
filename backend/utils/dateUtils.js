/**
 * Date / trading-day utilities for historical periods.
 *
 * All times are in IST (UTC + 5:30).
 * Trading days = Mon–Fri (weekends excluded).
 */

function toIST(date = new Date()) {
  const offset = 5.5 * 60;
  return new Date(date.getTime() + offset * 60 * 1000);
}

/** Subtract `n` trading days (skip Sat/Sun). */
function subtractTradingDays(date, n) {
  const d = new Date(date);
  let remaining = n;
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

/** Format a Date → dd-mm-yyyy (as required by NSE API). */
function formatNseDate(date) {
  const d = toIST(date);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Get the "from" date for the historical period we need (1 month of trading days). */
function getHistoryFromDate() {
  const today = toIST(new Date());
  // Fetch ~30 trading days to ensure we have enough data for 1-month calc
  const from = subtractTradingDays(today, 35);
  return formatNseDate(from);
}

/** Get today's date for the "to" parameter. */
function getHistoryToDate() {
  return formatNseDate(new Date());
}

module.exports = {
  toIST,
  subtractTradingDays,
  formatNseDate,
  getHistoryFromDate,
  getHistoryToDate,
};
