import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 15000; // 15 seconds

/**
 * Merge live API items into the static array, matching by `name`.
 * This ensures:
 *  - all 12 static items always display (including SGX Nifty)
 *  - correct static IDs are preserved (watchlist works)
 *  - live chg.today / last / base overlay when available
 */
function mergeGlobal(staticItems, liveItems) {
  if (!liveItems || liveItems.length === 0) return staticItems;
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.name, item));
  return staticItems.map((s) => {
    const live = liveMap.get(s.name);
    if (!live) return s;
    return {
      ...s,
      base: live.base ?? s.base,
      last: live.last ?? s.last,
      chg: { ...s.chg, today: live.chg?.today ?? s.chg.today },
    };
  });
}

export default function useGlobalData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/global');
        if (!mounted) return;
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(mergeGlobal(staticData, res.data.data));
          isLiveRef.current = true;
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[useGlobalData]', err.message);
        if (!isLiveRef.current) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { data: merged, isLive, loading, error };
}
