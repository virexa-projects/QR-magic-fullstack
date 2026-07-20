"use client";

import { createContext, useContext, useRef, useCallback, useEffect, ReactNode } from "react";

type RefreshFn = () => Promise<any> | any;

interface RefreshContextValue {
  registerRefresh: (fn: RefreshFn | null) => void;
  triggerRefresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const refreshFnRef = useRef<RefreshFn | null>(null);

  const registerRefresh = useCallback((fn: RefreshFn | null) => {
    refreshFnRef.current = fn;
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (refreshFnRef.current) {
      await refreshFnRef.current();
    }
    // no page has registered anything -> no-op, nothing global fires
  }, []);

  return (
    <RefreshContext.Provider value={{ registerRefresh, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefreshContext() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error("useRefreshContext must be used within RefreshProvider");
  return ctx;
}

/**
 * Call this inside any dashboard page to make the global header
 * RefreshButton refresh ONLY that page's data.
 *
 * Pass a stable/memoized fn (wrap in useCallback) and its deps array,
 * so the registered closure always has the latest selectedId/filters/etc.
 * Auto-unregisters on unmount so navigating away doesn't leave a stale
 * refresh handler behind.
 */
export function usePageRefresh(fn: RefreshFn, deps: any[] = []) {
  const { registerRefresh } = useRefreshContext();

  useEffect(() => {
    registerRefresh(fn);
    return () => registerRefresh(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}