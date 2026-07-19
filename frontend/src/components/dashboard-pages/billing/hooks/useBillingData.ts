import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { fetchPlans, fetchActiveSubscription } from "@/store/slices/Billingslice";
import type { ApiPlan, AppDispatch, RootState, ActiveSubscription } from "../billing.types";

export function useBillingData() {
  const dispatch = useDispatch<AppDispatch>();

  // Subscribe to only the specific slices of billing state we need,
  // rather than the whole `state.billing` object, so unrelated billing
  // state changes don't trigger a re-render here (rule: prevent Redux
  // over-subscription).
  const apiPlans = useSelector((state: RootState) => state.billing.plans) as ApiPlan[];
  const activeSubscription = useSelector(
    (state: RootState) => state.billing.activeSubscription
  ) as ActiveSubscription | null;
  const checkoutLoading = useSelector((state: RootState) => state.billing.checkoutLoading) as boolean;
  const freePlanLoading = useSelector((state: RootState) => state.billing.freePlanLoading) as boolean;

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchActiveSubscription());

    // Handle PayPal redirect back (only relevant if you ever fall back
    // to the hosted redirect flow instead of the inline Buttons widget).
    const params = new URLSearchParams(window.location.search);
    if (params.get("paypal") === "success") {
      toast.success("Payment received — activating your plan…");
      dispatch(fetchActiveSubscription());
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("paypal") === "cancelled") {
      toast("Checkout cancelled", { description: "No charge was made." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [dispatch]);

  return { dispatch, apiPlans, activeSubscription, checkoutLoading, freePlanLoading };
}
