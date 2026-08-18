"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Runs an async fetcher and tracks data/loading/error state.
 * `deps` controls when the fetch re-runs (mirrors useEffect deps).
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (!cancelled) {
          const payload = res && typeof res === 'object' && 'data' in res ? res.data : res;
          setData(payload);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => load(), [load]);

  return { data, loading, error, reload: load };
}
