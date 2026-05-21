/**
 * RBI Policy rates service.
 *
 * RBI rates (Repo, Reverse Repo, CRR, SLR, etc.) change
 * every 6–8 weeks after the MPC meeting.  We serve them as
 * static data with a very long cache (1 hour).
 *
 * In future this could be enhanced to scrape the RBI website
 * or use a news API to detect rate changes automatically.
 */

const RBI_RATES = [
  { name: 'RBI Repo Rate', val: '6.50%', note: 'RBI' },
  { name: 'Reverse Repo', val: '3.35%', note: 'RBI' },
  { name: 'CRR', val: '4.50%', note: 'RBI' },
  { name: 'SLR', val: '18.00%', note: 'RBI' },
  { name: 'Post Office FD', val: '7.50%', note: '1–3yr' },
  { name: 'NSC (5yr)', val: '7.70%', note: 'GoI' },
];

async function fetchRbiRates() {
  // Return a shallow copy — allows mutation by callers without
  // affecting the source array.
  return RBI_RATES.map((r) => ({ ...r }));
}

module.exports = { fetchRbiRates };
