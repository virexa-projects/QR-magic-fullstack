import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { switchToFreePlan, fetchActiveSubscription } from "@/store/slices/Billingslice";
import { fallbackPlans } from "../billing.constants";
import { tierRankOf, planKey } from "../billing.utils";
import type { ApiPlan, ActiveSubscription, AppDispatch, SubscriptionPlan } from "../billing.types";

export function useBillingPlans(
  dispatch: AppDispatch,
  apiPlans: ApiPlan[],
  activeSubscription: ActiveSubscription | null,
  openCheckout: (plan: ApiPlan) => void
) {
  const [downgradeTarget, setDowngradeTarget] = useState<ApiPlan | null>(null);

  const hasRealPlans = !!apiPlans && apiPlans.length > 0;
  const plans = useMemo(() => (hasRealPlans ? apiPlans : fallbackPlans), [hasRealPlans, apiPlans]);

  // The plan can come back either populated (object) or as a bare id
  // string depending on how the API responds — handle both.
  const subscriptionPlan: SubscriptionPlan | null = useMemo(
    () =>
      activeSubscription && typeof activeSubscription.plan === "object"
        ? (activeSubscription.plan as SubscriptionPlan)
        : null,
    [activeSubscription]
  );

  const currentPlanId = useMemo(
    () =>
      typeof activeSubscription?.plan === "string"
        ? activeSubscription.plan
        : subscriptionPlan?._id ?? "free",
    [activeSubscription, subscriptionPlan]
  );

  const currentPlanName = useMemo(
    () => plans.find((p: ApiPlan) => p._id === currentPlanId)?.name ?? subscriptionPlan?.name ?? "Free",
    [plans, currentPlanId, subscriptionPlan]
  );

  const isSubscriptionActive = activeSubscription?.status === "active";

  // Tier rank of whatever the user is actively paying for right now.
  // If there's no active paid subscription, they're effectively on Free
  // (rank 0), so every plan in the grid reads as an upgrade.
  const currentTierRank = useMemo(() => {
    if (!isSubscriptionActive) return 0;
    const key = subscriptionPlan?.slug ?? currentPlanId;
    return tierRankOf(key);
  }, [isSubscriptionActive, subscriptionPlan, currentPlanId]);

  // Free plans cost ₹0. switchToFreePlan on the backend schedules the
  // switch for end-of-period if a paid plan is currently active,
  // instead of applying it instantly — see handleSelectPlan below.
  const handleSwitchToFree = useCallback(
    async (plan: ApiPlan) => {
      const result = await dispatch(switchToFreePlan(plan._id));
      if (switchToFreePlan.fulfilled.match(result)) {
        dispatch(fetchActiveSubscription());
        if (isSubscriptionActive && currentTierRank > 0) {
          toast.success(`Free scheduled to start when your ${currentPlanName} plan ends`);
        }
      }
    },
    [dispatch, isSubscriptionActive, currentTierRank, currentPlanName]
  );

  const handleSelectPlan = useCallback(
    async (plan: ApiPlan) => {
      const targetRank = tierRankOf(planKey(plan));
      const isDowngrade = isSubscriptionActive && targetRank < currentTierRank;

      if (plan.price === 0) {
        if (isDowngrade) {
          // Free while a paid plan is active -> confirm, then schedule
          // for end-of-period (handled server-side by switchToFreePlan).
          setDowngradeTarget(plan);
          return;
        }
        await handleSwitchToFree(plan);
        return;
      }

      if (isDowngrade) {
        // Paid -> lower paid tier: confirm first, then the payment (if
        // any) gets scheduled for end-of-period too.
        setDowngradeTarget(plan);
        return;
      }

      openCheckout(plan);
    },
    [isSubscriptionActive, currentTierRank, handleSwitchToFree, openCheckout]
  );

  const confirmDowngrade = useCallback(async () => {
    if (!downgradeTarget) return;
    if (downgradeTarget.price === 0) {
      await handleSwitchToFree(downgradeTarget);
      setDowngradeTarget(null);
      return;
    }
    openCheckout(downgradeTarget);
    setDowngradeTarget(null);
  }, [downgradeTarget, handleSwitchToFree, openCheckout]);

  const closeDowngrade = useCallback(() => setDowngradeTarget(null), []);

  return {
    plans,
    hasRealPlans,
    subscriptionPlan,
    currentPlanId,
    currentPlanName,
    isSubscriptionActive,
    currentTierRank,
    downgradeTarget,
    handleSelectPlan,
    handleSwitchToFree,
    confirmDowngrade,
    closeDowngrade,
  };
}
