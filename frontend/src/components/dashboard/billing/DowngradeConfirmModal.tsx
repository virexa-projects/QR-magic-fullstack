import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiPlan } from "./billing.types";
import { formatDate } from "./billing.utils";

export function DowngradeConfirmModal({
  fromName,
  toPlan,
  endDate,
  loading,
  onClose,
  onConfirm,
}: {
  fromName: string;
  toPlan: ApiPlan;
  endDate?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <h3 className="text-base font-semibold font-heading text-foreground">
            Switch to {toPlan.name}?
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          You're moving from <span className="font-semibold text-foreground">{fromName}</span> down to{" "}
          <span className="font-semibold text-foreground">{toPlan.name}</span>.
          {endDate ? (
            <>
              {" "}This will take effect on{" "}
              <span className="font-semibold text-foreground">{formatDate(endDate)}</span>, when your
              current {fromName} billing period ends. You'll keep {fromName} — and all its features and
              limits — until then.
            </>
          ) : (
            <> This will take effect once your current billing period ends.</>
          )}
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-full">
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 h-10 rounded-full bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm switch"}
          </Button>
        </div>
      </div>
    </div>
  );
}