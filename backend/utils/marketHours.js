/**
 * Market hours utility.
 *
 * Indian equity market schedule (NSE):
 *   - Normal session: 9:15 AM to 3:30 PM IST
 *   - Pre-open: 9:00 AM – 9:15 AM (treated as closed here)
 *   - Weekends (Sat/Sun) → closed
 *
 * All times are in IST (UTC + 5:30).
 */

function toIST(date = new Date()) {
  const offset = 5.5 * 60; // minutes
  return new Date(date.getTime() + offset * 60 * 1000);
}

function getISTParts() {
  const now = toIST();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  return { day, hours, minutes, totalMinutes };
}

/** Is today a trading day? (Mon–Fri) */
function isTradingDay() {
  const { day } = getISTParts();
  return day >= 1 && day <= 5;
}

/** Is the market currently open? (9:15 – 15:30 IST) */
function isMarketOpen() {
  if (!isTradingDay()) return false;
  const { totalMinutes } = getISTParts();
  return totalMinutes >= 555 && totalMinutes < 930; // 9:15=555, 15:30=930
}

/** Time until next market open (ms) — useful for delayed restart */
function msUntilNextOpen() {
  const now = new Date();
  const ist = toIST(now);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const date = ist.getUTCDate();
  const day = ist.getUTCDay();

  // Next 9:15 AM IST
  let open = new Date(Date.UTC(year, month, date, 3, 45, 0)); // 9:15 IST = 03:45 UTC
  if (ist >= open) {
    // Move to next day
    open.setUTCDate(open.getUTCDate() + 1);
  }
  // Skip to Monday if weekend
  let openDay = open.getUTCDay();
  if (openDay === 6) open.setUTCDate(open.getUTCDate() + 2); // Sat → Mon
  if (openDay === 0) open.setUTCDate(open.getUTCDate() + 1); // Sun → Mon
  return open.getTime() - now.getTime();
}

/** Human-readable market status */
function getMarketStatus() {
  if (!isTradingDay()) return { open: false, label: 'Weekend / Holiday' };
  if (isMarketOpen()) return { open: true, label: 'Market Open' };
  const { totalMinutes } = getISTParts();
  if (totalMinutes < 555) return { open: false, label: 'Pre-market' };
  return { open: false, label: 'Market Closed' };
}

module.exports = {
  isTradingDay,
  isMarketOpen,
  msUntilNextOpen,
  getMarketStatus,
};
