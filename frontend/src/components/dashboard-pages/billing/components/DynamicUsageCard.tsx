import { memo } from "react";
import { Zap, Info } from "lucide-react";
import type { UsageSummary } from "@/lib/billing-format";

interface DynamicUsageCardProps {
  dynamicQrUsage: UsageSummary;
  nearLimit: boolean;
}

function DynamicUsageCardBase({ dynamicQrUsage, nearLimit }: DynamicUsageCardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Zap className="w-3.5 h-3.5" /> Dynamic QR usage
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">{dynamicQrUsage.label}</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        {dynamicQrUsage.isUnlimited ? (
          <div className="h-full rounded-full bg-emerald/30" style={{ width: "100%" }} />
        ) : (
          <div
            className={`h-full rounded-full transition-all ${
              nearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
            }`}
            style={{ width: `${dynamicQrUsage.percentage}%` }}
          />
        )}
      </div>

      {nearLimit && (
        <div className="mt-3 flex items-start gap-2 text-xs text-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
          <span>
            You've hit your limit. New dynamic QRs are paused until you upgrade or delete unused ones.
          </span>
        </div>
      )}
    </div>
  );
}

export const DynamicUsageCard = memo(DynamicUsageCardBase);
