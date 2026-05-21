import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 60_000;

/**
 * Merge live forex data into the static array, matching by `pair`.
 * Live items overlay { val, chg } on their static counterpart.
 */
function mergeForex(staticItems, liveItems) {
  if (!liveItems || liveItems.length === 0) return staticItems;
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.pair, item));
  return staticItems.map((s) => {
    const live = liveMap.get(s.pair);
    if (!live || live.val == null) return s;
    return {
      ...s,
      val: live.val,
      chg: live.percentChange ?? s.chg,
    };
  });
}

export default function useForexData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/forex');
        if (!mounted) return;
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(mergeForex(staticData, res.data.data));
          isLiveRef.current = true;
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[useForexData]', err.message);
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
