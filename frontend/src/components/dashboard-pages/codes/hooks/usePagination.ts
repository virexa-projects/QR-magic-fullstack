// components/dashboard-pages/codes/hooks/usePagination.ts
import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE_OPTIONS } from "../codes.constants";

export interface ServerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsePaginationOptions {
  /** Changes to this key (e.g. combined filters) reset the page back to 1. */
  resetKey?: string;
  initialPageSize?: number;
}

export interface UsePaginationResult {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  pageNumbers: number[];
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
  /** Call after a delete when the current page just became empty. */
  handleItemRemoved: (remainingOnPage: number) => void;
  pageSizeOptions: number[];
}

export function usePagination(server: ServerPagination, opts: UsePaginationOptions = {}): UsePaginationResult {
  const { resetKey, initialPageSize = 10 } = opts;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize]);

  const totalPages = Math.max(server.totalPages || 1, 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const realStart = Math.max(1, end - 4);
    for (let n = realStart; n <= end; n++) nums.push(n);
    return nums;
  }, [page, totalPages]);

  const handleItemRemoved = (remainingOnPage: number) => {
    if (remainingOnPage === 0 && page > 1) setPage((p) => p - 1);
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    canPrev,
    canNext,
    pageNumbers,
    goFirst: () => setPage(1),
    goPrev: () => canPrev && setPage((p) => p - 1),
    goNext: () => canNext && setPage((p) => p + 1),
    goLast: () => setPage(totalPages),
    handleItemRemoved,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
