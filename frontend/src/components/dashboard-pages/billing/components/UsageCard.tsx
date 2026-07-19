import { memo } from "react";
import { DynamicUsageCard } from "./DynamicUsageCard";
import { ScanUsageCard } from "./ScanUsageCard";
import { PlanLimitsCard } from "./PlanLimitsCard";
import type { UsageSummary } from "@/lib/billing-format";
import type { SubscriptionUsage } from "../billing.types";

interface UsageCardProps {
  usage: SubscriptionUsage;
  dynamicQrUsage: UsageSummary;
  nearLimit: boolean;
  scanUsage: UsageSummary;
  scanNearLimit: boolean;
}

function UsageCardBase({ usage, dynamicQrUsage, nearLimit, scanUsage, scanNearLimit }: UsageCardProps) {
  return (
    <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card space-y-6">
      <DynamicUsageCard dynamicQrUsage={dynamicQrUsage} nearLimit={nearLimit} />
      <div className="border-t border-border/60" />
      <ScanUsageCard scanUsage={scanUsage} scanNearLimit={scanNearLimit} scansResetAt={usage.scansResetAt} />
      <PlanLimitsCard qrLimit={usage.qrLimit} scanLimitPerMonth={usage.scanLimitPerMonth} />
    </section>
  );
}

export const UsageCard = memo(UsageCardBase);
