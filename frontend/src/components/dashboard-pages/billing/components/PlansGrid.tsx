import { memo } from "react";
import { PlanCard } from "./PlanCard";
import type { ApiPlan, ScheduledChange } from "../billing.types";

interface PlansGridProps {
  plans: ApiPlan[];
  currentPlanId: string;
  isSubscriptionActive: boolean;
  currentTierRank: number;
  scheduledChange: ScheduledChange | null;
  hasRealPlans: boolean;
  checkoutLoading: boolean;
  freePlanLoading: boolean;
  onSelectPlan: (plan: ApiPlan) => void;
}

function PlansGridBase({
  plans,
  currentPlanId,
  isSubscriptionActive,
  currentTierRank,
  scheduledChange,
  hasRealPlans,
  checkoutLoading,
  freePlanLoading,
  onSelectPlan,
}: PlansGridProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {plans.map((plan, idx) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          isPopular={idx === 1} // middle plan highlighted, same as original design
          currentPlanId={currentPlanId}
          isSubscriptionActive={isSubscriptionActive}
          currentTierRank={currentTierRank}
          scheduledChange={scheduledChange}
          hasRealPlans={hasRealPlans}
          checkoutLoading={checkoutLoading}
          freePlanLoading={freePlanLoading}
          onSelectPlan={onSelectPlan}
        />
      ))}
    </div>
  );
}

export const PlansGrid = memo(PlansGridBase);
