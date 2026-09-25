"use client";

import { useCallback, useSyncExternalStore } from "react";

export const MOBILE_QUERY = "(max-width: 767px)";

/** Matches the original picker's <768px breakpoint. SSR-safe (false on the server). */
export function useIsMobile(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(MOBILE_QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}
