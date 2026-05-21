import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 300_000;

/**
 * Merge live bond data into the static array, matching by `name`.
 */
function mergeBonds(staticItems, liveItems) {
  if (!liveItems || liveItems.length === 0) return staticItems;
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.name, item));
  return staticItems.map((s) => {
    const live = liveMap.get(s.name);
    if (!live) return s;
    return {
      ...s,
      val: live.yield != null ? `${live.yield}%` : s.val,
      note: live.note ?? s.note,
      isLive: live.isLive ?? false,
    };
  });
}

export default function useBondsData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/bonds');
        if (!mounted) return;
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(mergeBonds(staticData, res.data.data));
          isLiveRef.current = true;
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[useBondsData]', err.message);
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
