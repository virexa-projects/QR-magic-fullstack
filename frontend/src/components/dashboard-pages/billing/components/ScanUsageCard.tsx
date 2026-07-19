import { memo } from "react";
import { TrendingUp, Info } from "lucide-react";
import { formatDate } from "../billing.utils";
import type { UsageSummary } from "@/lib/billing-format";

interface ScanUsageCardProps {
  scanUsage: UsageSummary;
  scanNearLimit: boolean;
  scansResetAt?: string;
}

function ScanUsageCardBase({ scanUsage, scanNearLimit, scansResetAt }: ScanUsageCardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <TrendingUp className="w-3.5 h-3.5" /> Scans this month
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">{scanUsage.label}</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        {scanUsage.isUnlimited ? (
          <div className="h-full rounded-full bg-emerald/30" style={{ width: "100%" }} />
        ) : (
          <div
            className={`h-full rounded-full transition-all ${
              scanNearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
            }`}
            style={{ width: `${scanUsage.percentage}%` }}
          />
        )}
      </div>

      {scanNearLimit && scansResetAt && (
        <div className="mt-3 flex items-start gap-2 text-xs text-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
          <span>
            {scanUsage.percentage >= 100
              ? "You've used all your scans for this month. Scanning still works for visitors, but tracking pauses"
              : "You're close to your monthly scan limit"}{" "}
            until it resets on <span className="font-semibold">{formatDate(scansResetAt)}</span>.
          </span>
        </div>
      )}
    </div>
  );
}

export const ScanUsageCard = memo(ScanUsageCardBase);
