import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 15_000;

function mergeCommodities(staticItems, liveItems) {
  if (!liveItems || liveItems.length === 0) return staticItems;
  const liveMap = new Map();
  liveItems.forEach((item) => liveMap.set(item.name, item));
  const result = staticItems.map((s) => {
    const live = liveMap.get(s.name);
    if (!live) {
      console.warn('[useCommoditiesData] No live match for', s.name);
      return s;
    }
    return {
      ...s,
      last: live.last,
      chg: { ...s.chg, today: live.percentChange ?? s.chg.today },
    };
  });
  console.log('[useCommoditiesData] Merged:', result.map(r => r.name + ': base=' + r.base + ' chg.today=' + r.chg.today).join(' | '));
  return result;
}

export default function useCommoditiesData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/commodities');
        if (!mounted) return;
        console.log('[useCommoditiesData] API response data count:', res.data?.data?.length);
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(mergeCommodities(staticData, res.data.data));
          isLiveRef.current = true;
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[useCommoditiesData] Fetch error:', err.message);
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
