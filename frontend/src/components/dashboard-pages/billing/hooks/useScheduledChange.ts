import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cancelScheduledChange, fetchActiveSubscription } from "@/store/slices/Billingslice";
import type { ActiveSubscription, AppDispatch } from "../billing.types";

export function useScheduledChange(dispatch: AppDispatch, activeSubscription: ActiveSubscription | null) {
  const [cancelScheduleLoading, setCancelScheduleLoading] = useState(false);
  const scheduledChange = activeSubscription?.scheduledChange ?? null;

  const handleCancelScheduledChange = useCallback(async () => {
    setCancelScheduleLoading(true);
    try {
      const result = await dispatch(cancelScheduledChange());
      if (cancelScheduledChange.fulfilled.match(result)) {
        toast.success("Scheduled plan change cancelled");
        dispatch(fetchActiveSubscription());
      }
    } finally {
      setCancelScheduleLoading(false);
    }
  }, [dispatch]);

  return { scheduledChange, cancelScheduleLoading, handleCancelScheduledChange };
}
