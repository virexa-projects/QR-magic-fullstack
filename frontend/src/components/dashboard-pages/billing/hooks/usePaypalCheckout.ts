import { useCallback, useRef, useState, type MutableRefObject } from "react";
import {
  createPaypalOrder,
  capturePaypalOrder,
  clearPaypalOrder,
  fetchActiveSubscription,
} from "@/store/slices/Billingslice";
import type { PaypalResult } from "../components/PaypalModal";
import type { ApiPlan, AppDispatch } from "../billing.types";

export function usePaypalCheckout(
  dispatch: AppDispatch,
  currentPlanNameRef: MutableRefObject<string>
) {
  const [pickerPlan, setPickerPlan] = useState<ApiPlan | null>(null);

  // Holds the currently selected plan independently of React state.
  const pickerPlanRef = useRef<ApiPlan | null>(null);

  const [paypalResult, setPaypalResult] =
    useState<PaypalResult | null>(null);

  const retryPlanRef = useRef<ApiPlan | null>(null);
  const pendingSubscriptionIdRef = useRef<string | null>(null);

  const openCheckout = useCallback((plan: ApiPlan) => {
    pickerPlanRef.current = plan;
    setPickerPlan(plan);
  }, []);

  const closeCheckout = useCallback(() => {
    pickerPlanRef.current = null;
    setPickerPlan(null);
  }, []);

  const closeResult = useCallback(() => {
    setPaypalResult(null);
  }, []);

  const handleCreatePaypalOrder = useCallback(
    async (plan: ApiPlan): Promise<string> => {
      const result = await dispatch(createPaypalOrder(plan._id));

      if (createPaypalOrder.rejected.match(result)) {
        throw new Error(
          (result.payload as string) ||
            "Failed to create PayPal order"
        );
      }

      const order = result.payload as {
        orderId: string;
        subscriptionId: string;
      };

      pendingSubscriptionIdRef.current = order.subscriptionId;

      return order.orderId;
    },
    [dispatch]
  );

  const handlePaypalApprove = useCallback(
    async (orderId: string) => {
      const subscriptionId = pendingSubscriptionIdRef.current;

      if (!subscriptionId) {
        pickerPlanRef.current = null;
        setPickerPlan(null);

        setPaypalResult({
          status: "error",
          message:
            "Something went wrong — missing subscription reference.",
          retryable: false,
        });

        return;
      }

      const capturingPlan = pickerPlanRef.current;

      retryPlanRef.current = capturingPlan;

      pickerPlanRef.current = null;
      setPickerPlan(null);

      setPaypalResult({
        status: "processing",
      });

      const result = await dispatch(
        capturePaypalOrder({
          orderId,
          subscriptionId,
        })
      );

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
          setPaypalResult({
            status: "scheduled",
            planName: capturingPlan?.name ?? "your new plan",
            fromPlanName: currentPlanNameRef.current,
            effectiveDate:
              subscription.startDate ??
              new Date().toISOString(),
          });
        } else {
          setPaypalResult({
            status: "success",
            planName: capturingPlan?.name ?? "your new plan",
            amount: subscription.amount,
            currency: subscription.currency,
            paymentId:
              subscription.paymentId ?? orderId,
            date:
              subscription.createdAt ??
              new Date().toISOString(),
          });
        }
      } else {
        setPaypalResult({
          status: "error",
          message:
            (result.payload as string) ||
            "Payment could not be completed.",
          retryable: true,
        });
      }

      pendingSubscriptionIdRef.current = null;
    },
    [dispatch, currentPlanNameRef]
  );

  const handlePaypalError = useCallback((message: string) => {
    retryPlanRef.current = pickerPlanRef.current;

    pickerPlanRef.current = null;
    setPickerPlan(null);

    setPaypalResult({
      status: "error",
      message,
      retryable: true,
    });
  }, []);

  const handleRetryPaypal = useCallback(() => {
    const plan = retryPlanRef.current;

    setPaypalResult(null);

    if (plan) {
      pickerPlanRef.current = plan;
      setPickerPlan(plan);
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