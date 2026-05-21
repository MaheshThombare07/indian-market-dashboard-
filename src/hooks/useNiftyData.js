import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 5000;

/**
 * Custom hook: fetches live NIFTY data from the Express backend.
 *
 * Merges live NSE values with static data so all time-periods
 * (yesterday, 5days, 1month) still work from the static fallback.
 *
 * Returns: { data, loading, error, marketOpen, isLive }
 *   data      – complete NIFTY array (live values merged in)
 *   isLive    – true when backend data is being used
 */
export default function useNiftyData(staticData) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/nifty');
      const valid = res.data?.status === 'ok' || res.data?.status === 'stale';
      if (!valid) {
        console.warn('[useNiftyData] Unexpected API response', res.data);
        return;
      }
      // Merge live values into the static data shape
      const merged = mergeLiveWithStatic(res.data.data, staticData);
      setLiveData(merged);
      setMarketOpen(res.data.marketOpen);
      setError(null);
      console.log(`[useNiftyData] ✅ ${merged.length} indices (live=${res.data.marketOpen ? 'open' : 'cached'})`);
    } catch (err) {
      console.warn('[useNiftyData] Fetch failed:', err.message);
      if (!liveData) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  const data = liveData ?? staticData;
  const isLive = liveData !== null;

  return { data, loading, error, marketOpen, isLive };
}

/**
 * Map live NSE items by id, then merge into the full static array so
 * every static item keeps its other time-periods (yesterday, etc.).
 */
function mergeLiveWithStatic(liveItems, staticItems) {
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.id, item));

  return staticItems.map((staticItem) => {
    const live = liveMap.get(staticItem.id);
    if (!live) return staticItem; // keep static as-is
    return {
      ...staticItem,
      base: live.base ?? staticItem.base,
      last: live.last,
      change: live.change,
      percentChange: live.percentChange,
      chg: {
        ...staticItem.chg,
        today: live.percentChange ?? live.chg?.today ?? staticItem.chg?.today ?? 0,
      },
    };
  });
}
