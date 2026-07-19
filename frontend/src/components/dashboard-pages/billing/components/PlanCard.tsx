import { memo } from "react";
import type { ReactNode } from "react";
import { Check, Sparkles, Crown, ArrowRight, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tierRankOf, planKey } from "../billing.utils";
import type { ApiPlan, ScheduledChange } from "../billing.types";

interface PlanCardProps {
  plan: ApiPlan;
  isPopular: boolean;
  currentPlanId: string;
  isSubscriptionActive: boolean;
  currentTierRank: number;
  scheduledChange: ScheduledChange | null;
  hasRealPlans: boolean;
  checkoutLoading: boolean;
  freePlanLoading: boolean;
  onSelectPlan: (plan: ApiPlan) => void;
}

function PlanCardBase({
  plan,
  isPopular,
  currentPlanId,
  isSubscriptionActive,
  currentTierRank,
  scheduledChange,
  hasRealPlans,
  checkoutLoading,
  freePlanLoading,
  onSelectPlan,
}: PlanCardProps) {
  const isCurrent = plan._id === currentPlanId && isSubscriptionActive;
  const price = plan.price;

  const targetRank = tierRankOf(planKey(plan));
  const isDowngrade = !isCurrent && isSubscriptionActive && targetRank < currentTierRank;
  const isUpgrade = !isCurrent && (!isSubscriptionActive || targetRank > currentTierRank);

  // This plan is exactly what's already scheduled to take over — show
  // it as pending rather than offering to pick it again.
  const isAlreadyScheduled = scheduledChange?.planName === plan.name;

  const isDisabled = isCurrent || isAlreadyScheduled || checkoutLoading || freePlanLoading || !hasRealPlans;

  let buttonLabel: ReactNode;
  if (isCurrent) {
    buttonLabel = "Your current plan";
  } else if (isAlreadyScheduled) {
    buttonLabel = "Scheduled";
  } else if (plan.price === 0 && freePlanLoading) {
    buttonLabel = <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
  } else if (plan.price === 0) {
    buttonLabel = "Switch to Free";
  } else if (isDowngrade) {
    buttonLabel = (
      <span className="inline-flex items-center gap-1.5">
        <ArrowDown className="w-3.5 h-3.5" /> Switch to {plan.name}
      </span>
    );
  } else {
    buttonLabel = `Upgrade to ${plan.name}`;
  }

  return (
    <div
      className={`relative rounded-2xl p-6 border bg-card transition-all ${
        isPopular ? "border-emerald/40 shadow-emerald ring-1 ring-emerald/20" : "border-border/60 shadow-card"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald text-emerald-foreground text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Recommended
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold font-heading text-foreground">{plan.name}</h3>
            {plan._id === "business" && <Crown className="w-3.5 h-3.5 text-warning" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
        </div>
        {isCurrent && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            Current
          </span>
        )}
        {isAlreadyScheduled && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning">
            Scheduled
          </span>
        )}
        {isDowngrade && !isCurrent && !isAlreadyScheduled && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning">
            Downgrade
          </span>
        )}
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-bold font-heading text-foreground">
          {plan.currency === "INR" ? "₹" : "$"}
          {price.toLocaleString("en-US")}
        </span>
        <span className="text-xs text-muted-foreground">{price === 0 ? "forever" : "/mo"}</span>
      </div>

      <Button
        disabled={isDisabled}
        onClick={() => onSelectPlan(plan)}
        title={!hasRealPlans ? "Plans are still loading — please wait" : undefined}
        className={`w-full mt-5 h-10 rounded-full font-semibold ${
          isPopular
            ? "bg-emerald hover:bg-emerald/90 text-emerald-foreground"
            : isCurrent || isAlreadyScheduled
            ? "bg-secondary text-muted-foreground hover:bg-secondary cursor-default"
            : isDowngrade
            ? "bg-warning/90 hover:bg-warning text-warning-foreground"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        }`}
      >
        {buttonLabel}
        {isUpgrade && plan.price !== 0 && <ArrowRight className="w-4 h-4 ml-1.5" />}
      </Button>

      <div className="mt-6 pt-5 border-t border-border/60 space-y-2.5">
        {(plan.features ?? []).map((f) => (
          <div key={f} className="flex items-start gap-2 text-[13px]">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald" />
            <span className="text-foreground/90">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PlanCard = memo(PlanCardBase);
