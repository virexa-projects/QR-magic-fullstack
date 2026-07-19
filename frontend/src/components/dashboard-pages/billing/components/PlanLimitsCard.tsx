import { memo } from "react";
import { formatLimit } from "@/lib/billing-format";

interface PlanLimitsCardProps {
  qrLimit: number;
  scanLimitPerMonth: number;
}

function PlanLimitsCardBase({ qrLimit, scanLimitPerMonth }: PlanLimitsCardProps) {
  return (
    <div className="border-t border-border/60 pt-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Plan limits
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold font-heading text-foreground">{formatLimit(qrLimit)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total QR codes</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-heading text-foreground">
            {formatLimit(scanLimitPerMonth)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Scans / month cap</div>
        </div>
      </div>
    </div>
  );
}

export const PlanLimitsCard = memo(PlanLimitsCardBase);
