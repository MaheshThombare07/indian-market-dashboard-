import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 1_800_000; // 30 minutes

export default function useRbiData(staticData) {
  const [merged, setMerged] = useState(staticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLiveRef = useRef(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/rbi');
        if (!mounted) return;
        if (res.data?.status === 'ok' || res.data?.status === 'stale') {
          setMerged(res.data.data ?? staticData);
          isLiveRef.current = true;
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[useRbiData]', err.message);
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
