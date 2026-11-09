import { useEffect, useMemo, useState } from "react";
import { getPointsValuation } from "./api";

/**
 * Fetches a points valuation once per distinct program name and caches it in state.
 * Returns { [program]: {floor, ceiling, ...} | null }; absent key = not loaded yet.
 */
export function useValuations(programs) {
  const [map, setMap] = useState({});
  const key = useMemo(() => [...new Set((programs || []).filter(Boolean))].sort().join("|"), [programs]);

  useEffect(() => {
    let cancelled = false;
    const todo = key ? key.split("|") : [];
    todo.forEach(p => {
      getPointsValuation(p).then(v => {
        if (!cancelled) setMap(prev => (p in prev ? prev : { ...prev, [p]: v }));
      });
    });
    return () => { cancelled = true; };
  }, [key]);

  return map;
}
