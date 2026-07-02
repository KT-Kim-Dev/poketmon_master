import { useCallback, useEffect, useState } from 'react';
import { fetchRankings, isRankingAvailable } from '../api/rankings';

export function useRankings(autoLoad = true, refreshKey = 0) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(autoLoad && isRankingAvailable());
  const [error, setError] = useState(null);
  const available = isRankingAvailable();

  const load = useCallback(async () => {
    if (!available) {
      setRankings([]);
      setError(null);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRankings();
      setRankings(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load, refreshKey]);

  return { rankings, loading, error, available, reload: load };
}
