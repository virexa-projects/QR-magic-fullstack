"use client";

import { RefreshCw } from "lucide-react";
import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { useRefreshContext } from "@/components/Context/RefreshContext";

interface RefreshButtonProps {
  /** Optional override — if omitted, falls back to whatever the current page registered via usePageRefresh */
  onRefresh?: (dispatch: AppDispatch) => Promise<any> | any;
  loading?: boolean;
  className?: string;
  label?: string;
}

export default function RefreshButton({
  onRefresh,
  loading = false,
  className = "",
  label = "Refresh",
}: RefreshButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { triggerRefresh } = useRefreshContext();
  const [spinning, setSpinning] = useState(false);

  const handleClick = useCallback(async () => {
    if (spinning || loading) return;
    setSpinning(true);
    try {
      if (onRefresh) {
        await onRefresh(dispatch); // explicit override, e.g. page-specific hardcode
      } else {
        await triggerRefresh(); // whatever the current page registered
      }
    } finally {
      setSpinning(false);
    }
  }, [dispatch, onRefresh, spinning, loading, triggerRefresh]);

  const isActive = spinning || loading;

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      aria-label={label}
      title={label}
      className={`p-2 rounded-md hover:bg-muted transition disabled:opacity-50 ${className}`}
    >
      <RefreshCw className={`w-4 h-4 ${isActive ? "animate-spin" : ""}`} />
    </button>
  );
}