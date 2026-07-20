// components/dashboard-pages/codes/hooks/useQrFilters.ts
import { useEffect, useState } from "react";
import type { SortOption } from "../codes.types";

export interface UseQrFiltersResult {
  query: string;
  setQuery: (v: string) => void;
  debouncedQuery: string;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  /** Bumps whenever any filter changes — consumers (e.g. usePagination) can key off this to reset to page 1. */
  filtersKey: string;
}

export function useQrFilters(debounceMs = 400): UseQrFiltersResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  return {
    query,
    setQuery,
    debouncedQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filtersKey: `${debouncedQuery}|${typeFilter}|${statusFilter}|${sortBy}`,
  };
}
