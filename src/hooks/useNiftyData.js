import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 5000;

/**
 * Custom hook: fetches live NIFTY data from the Express backend.
 *
 * The `/api/nifty` response now includes chg.today, chg['5days'],
 * and chg['1month'] (extracted from NSE allIndices fields).
 * The `yesterday` period falls back to static data since NSE doesn't
 * expose the day-before-previous-close in a single snapshot.
 *
 * Returns: { data, loading, error, marketOpen, isLive }
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
      if (!valid) return;

      const merged = mergeAll(staticData, res.data.data);
      setLiveData(merged);
      setMarketOpen(res.data.marketOpen);
      setError(null);
    } catch (err) {
      console.warn('[useNiftyData]', err.message);
      if (!liveData) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return {
    data: liveData ?? staticData,
    isLive: liveData !== null,
    loading,
    error,
    marketOpen,
  };
}

function mergeAll(staticItems, liveItems) {
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.id, item));

  return staticItems.map((staticItem) => {
    const live = liveMap.get(staticItem.id);
    if (!live) return staticItem;

    return {
      ...staticItem,
      base: live.base ?? staticItem.base,
      last: live.last,
      change: live.change,
      percentChange: live.percentChange,
      chg: {
        ...staticItem.chg,        // static fallback for yesterday
        ...(live.chg || {}),      // live data (today, 5days, 1month)
      },
    };
  });
}
