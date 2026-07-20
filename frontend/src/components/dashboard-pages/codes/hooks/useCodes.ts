// components/dashboard-pages/codes/hooks/useCodes.ts
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchQrCodes, QrType, QrStatus } from "@/store/slices/qrSlice";
import { useQrFilters } from "./useQrFilters";
import { usePagination } from "./usePagination";

export function useCodes() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, pagination, loading, actionLoading } = useSelector((state: RootState) => state.qr);

  const filters = useQrFilters();
  const paging = usePagination(pagination, { resetKey: filters.filtersKey });

  useEffect(() => {
    dispatch(
      fetchQrCodes({
        page: paging.page,
        limit: paging.pageSize,
        search: filters.debouncedQuery || undefined,
        type: filters.typeFilter !== "all" ? (filters.typeFilter as QrType) : undefined,
        status: filters.statusFilter !== "all" ? (filters.statusFilter as QrStatus) : undefined,
        sort: filters.sortBy,
      })
    );
  }, [dispatch, paging.page, paging.pageSize, filters.debouncedQuery, filters.typeFilter, filters.statusFilter, filters.sortBy]);

  const refetch = () =>
    dispatch(
      fetchQrCodes({
        page: paging.page,
        limit: paging.pageSize,
        search: filters.debouncedQuery || undefined,
        type: filters.typeFilter !== "all" ? (filters.typeFilter as QrType) : undefined,
        status: filters.statusFilter !== "all" ? (filters.statusFilter as QrStatus) : undefined,
        sort: filters.sortBy,
      })
    );

  return { items, pagination, loading, actionLoading, filters, paging, refetch };
}
