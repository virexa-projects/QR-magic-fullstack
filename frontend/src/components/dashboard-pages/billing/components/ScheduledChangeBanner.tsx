import { memo } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "../billing.utils";
import type { ScheduledChange } from "../billing.types";

interface ScheduledChangeBannerProps {
  scheduledChange: ScheduledChange;
  currentPlanName: string;
  cancelScheduleLoading: boolean;
  onCancel: () => void;
}

function ScheduledChangeBannerBase({
  scheduledChange,
  currentPlanName,
  cancelScheduleLoading,
  onCancel,
}: ScheduledChangeBannerProps) {
  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 text-sm text-foreground">
        <CalendarClock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <span>
          Switching to <span className="font-semibold">{scheduledChange.planName}</span> on{" "}
          <span className="font-semibold">{formatDate(scheduledChange.effectiveDate)}</span>.
          You'll keep {currentPlanName} until then.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={cancelScheduleLoading}
        onClick={onCancel}
        className="h-8 rounded-full text-xs shrink-0"
      >
        {cancelScheduleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel change"}
      </Button>
    </div>
  );
}

export const ScheduledChangeBanner = memo(ScheduledChangeBannerBase);
