import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 5000;

/**
 * Merge live BSE items into the static array, matching by `name`.
 *
 * Static BSE IDs (`bpwr`, `bcg`, …) differ from anything the NSE API
 * could produce, so we match on `name` instead of `id`.
 */
function mergeBse(staticItems, liveItems) {
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
      chg: { ...s.chg, ...(live.chg || {}) },
    };
  });
}

export default function useBseData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/bse');
        if (!mounted) return;
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(mergeBse(staticData, res.data.data));
          isLiveRef.current = true;
          setIsLive(true);
          setMarketOpen(!!res.data.marketOpen);
          setError(null);
        }
      } catch (err) {
        console.warn('[useBseData]', err.message);
        if (!isLiveRef.current) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { data: merged, isLive, loading, error, marketOpen };
}
