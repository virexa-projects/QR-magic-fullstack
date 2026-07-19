import { useMemo } from "react";
import { calculateUsage } from "@/lib/billing-format";
import { daysRemaining } from "../billing.utils";
import { freeUsageDefaults } from "../billing.constants";
import type { ActiveSubscription, SubscriptionUsage } from "../billing.types";

export function useSubscriptionUsage(activeSubscription: ActiveSubscription | null) {
  // Real usage numbers, falling back to sensible free-tier defaults
  // when there's no active subscription yet.
  const usage: SubscriptionUsage = activeSubscription?.usage ?? freeUsageDefaults;

  const dynamicQrUsage = useMemo(
    () => calculateUsage(usage.dynamicQrUsed, usage.dynamicQrLimit),
    [usage.dynamicQrUsed, usage.dynamicQrLimit]
  );
  const nearLimit = !dynamicQrUsage.isUnlimited && dynamicQrUsage.percentage >= 80;

  const scanUsage = useMemo(
    () => calculateUsage(usage.scansUsed ?? 0, usage.scanLimitPerMonth),
    [usage.scansUsed, usage.scanLimitPerMonth]
  );
  const scanNearLimit = !scanUsage.isUnlimited && scanUsage.percentage >= 80;

  const remainingDays = useMemo(
    () => daysRemaining(activeSubscription?.endDate),
    [activeSubscription?.endDate]
  );

  return { usage, dynamicQrUsage, nearLimit, scanUsage, scanNearLimit, remainingDays };
}
