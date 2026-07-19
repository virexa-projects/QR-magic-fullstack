import { useCallback, useRef, useState, type MutableRefObject } from "react";
import {
  createPaypalOrder,
  capturePaypalOrder,
  clearPaypalOrder,
  fetchActiveSubscription,
} from "@/store/slices/Billingslice";
import type { PaypalResult } from "../components/PaypalModal";
import type { ApiPlan, AppDispatch } from "../billing.types";

// currentPlanNameRef is read (not a dependency) so this hook's callbacks
// stay stable across renders where only the plan name changes, while
// still reading the freshest value at call time — mirrors how the
// original component always recomputed currentPlanName fresh each render.
export function usePaypalCheckout(dispatch: AppDispatch, currentPlanNameRef: MutableRefObject<string>) {
  const [pickerPlan, setPickerPlan] = useState<ApiPlan | null>(null);

  // Post-checkout result modal (processing / success / scheduled / error).
  // Lives here, not inside PaypalCheckoutModal, because that modal is
  // closed the instant onApprove fires — its state would be gone right
  // when we need to show the outcome.
  const [paypalResult, setPaypalResult] = useState<PaypalResult | null>(null);
  const retryPlanRef = useRef<ApiPlan | null>(null);
  const pendingSubscriptionIdRef = useRef<string | null>(null);

  const openCheckout = useCallback((plan: ApiPlan) => setPickerPlan(plan), []);
  const closeCheckout = useCallback(() => setPickerPlan(null), []);
  const closeResult = useCallback(() => setPaypalResult(null), []);

  // Step 1: ask the backend to create a PayPal order for this plan,
  // stash the subscriptionId so onApprove can pass it to /capture.
  const handleCreatePaypalOrder = useCallback(
    async (plan: ApiPlan): Promise<string> => {
      const result = await dispatch(createPaypalOrder(plan._id));
      if (createPaypalOrder.rejected.match(result)) {
        throw new Error((result.payload as string) || "Failed to create PayPal order");
      }
      const order = result.payload as { orderId: string; subscriptionId: string };
      pendingSubscriptionIdRef.current = order.subscriptionId;
      return order.orderId;
    },
    [dispatch]
  );

  // Step 2: buyer approved in the PayPal popup -> capture server-side.
  const handlePaypalApprove = useCallback(
    async (orderId: string) => {
      const subscriptionId = pendingSubscriptionIdRef.current;
      if (!subscriptionId) {
        setPickerPlan(null);
        setPaypalResult({
          status: "error",
          message: "Something went wrong — missing subscription reference.",
          retryable: false,
        });
        return;
      }

      let capturingPlan: ApiPlan | null = null;
      setPickerPlan((current) => {
        capturingPlan = current;
        return null;
      });
      retryPlanRef.current = capturingPlan;

      // Show "processing" immediately — capture can take a couple
      // seconds and the buyer just left the PayPal popup, so a blank
      // gap here reads as broken.
      setPaypalResult({ status: "processing" });

      const result = await dispatch(capturePaypalOrder({ orderId, subscriptionId }));

      if (capturePaypalOrder.fulfilled.match(result)) {
        dispatch(fetchActiveSubscription());
        dispatch(clearPaypalOrder());

        const subscription = result.payload as {
          status: string;
          amount: number;
          currency: string;
          paymentId?: string;
          startDate?: string;
          createdAt?: string;
        };

        if (subscription.status === "scheduled") {
          // Paid downgrade — captured, but scheduled for end-of-period
          // rather than active right now. See activateOrScheduleSubscription.
          setPaypalResult({
            status: "scheduled",
            planName: capturingPlan?.name ?? "your new plan",
            fromPlanName: currentPlanNameRef.current,
            effectiveDate: subscription.startDate ?? new Date().toISOString(),
          });
        } else {
          setPaypalResult({
            status: "success",
            planName: capturingPlan?.name ?? "your new plan",
            amount: subscription.amount,
            currency: subscription.currency,
            paymentId: subscription.paymentId ?? orderId,
            date: subscription.createdAt ?? new Date().toISOString(),
          });
        }
      } else {
        setPaypalResult({
          status: "error",
          message: (result.payload as string) || "Payment could not be completed.",
          retryable: true,
        });
      }

      pendingSubscriptionIdRef.current = null;
    },
    [dispatch, currentPlanNameRef]
  );

  const handlePaypalError = useCallback((message: string) => {
    setPickerPlan((current) => {
      retryPlanRef.current = current;
      return null;
    });
    setPaypalResult({ status: "error", message, retryable: true });
  }, []);

  const handleRetryPaypal = useCallback(() => {
    const plan = retryPlanRef.current;
    setPaypalResult(null);
    if (plan) {
      setPickerPlan(plan); // reopens PaypalCheckoutModal for the same plan
    }
  }, []);

  return {
    pickerPlan,
    paypalResult,
    openCheckout,
    closeCheckout,
    closeResult,
    handleCreatePaypalOrder,
    handlePaypalApprove,
    handlePaypalError,
    handleRetryPaypal,
  };
}
