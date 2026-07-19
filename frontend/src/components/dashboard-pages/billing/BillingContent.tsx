"use client";

import { useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";import { useBillingData } from "./hooks/useBillingData";
import { useBillingPlans } from "./hooks/useBillingPlans";
import { usePaypalCheckout } from "./hooks/usePaypalCheckout";
import { useSubscriptionUsage } from "./hooks/useSubscriptionUsage";
import { useScheduledChange } from "./hooks/useScheduledChange";
import { PageHeader } from "./components/PageHeader";
import { ScheduledChangeBanner } from "./components/ScheduledChangeBanner";
import { SubscriptionSummary } from "./components/SubscriptionSummary";
import { UsageCard } from "./components/UsageCard";
import { PlansHeader } from "./components/PlansHeader";
import { PlansGrid } from "./components/PlansGrid";
import { PaymentMethodCard } from "./components/PaymentMethodCard";
import { InvoiceCard } from "./components/InvoiceCard";
import { PaypalModal, PaypalCheckoutModal, DowngradeConfirmModal } from "./lazy";

export default function BillingContent() {
  const { dispatch, apiPlans, activeSubscription, checkoutLoading, freePlanLoading } = useBillingData();
  const { scheduledChange, cancelScheduleLoading, handleCancelScheduledChange } = useScheduledChange(
    dispatch,
    activeSubscription
  );

  const usage = useSubscriptionUsage(activeSubscription);

  // Ref breaks a naming cycle: paypal needs the current plan name for
  // its "scheduled" copy, but that name comes from useBillingPlans,
  // which needs paypal.openCheckout to exist first.
  const currentPlanNameRef = useRef("Free");
  const paypal = usePaypalCheckout(dispatch, currentPlanNameRef);
  const billingPlans = useBillingPlans(dispatch, apiPlans, activeSubscription, paypal.openCheckout);

  useEffect(() => {
    currentPlanNameRef.current = billingPlans.currentPlanName;
  }, [billingPlans.currentPlanName]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader activeSubscription={activeSubscription} currentPlanName={billingPlans.currentPlanName} />

        {scheduledChange && (
          <ScheduledChangeBanner
            scheduledChange={scheduledChange}
            currentPlanName={billingPlans.currentPlanName}
            cancelScheduleLoading={cancelScheduleLoading}
            onCancel={handleCancelScheduledChange}
          />
        )}

        {activeSubscription && billingPlans.subscriptionPlan && (
          <SubscriptionSummary
            activeSubscription={activeSubscription}
            subscriptionPlan={billingPlans.subscriptionPlan}
          />
        )}

        <UsageCard
          usage={usage.usage}
          dynamicQrUsage={usage.dynamicQrUsage}
          nearLimit={usage.nearLimit}
          scanUsage={usage.scanUsage}
          scanNearLimit={usage.scanNearLimit}
        />

        <PlansHeader hasRealPlans={billingPlans.hasRealPlans} />

        <PlansGrid
          plans={billingPlans.plans}
          currentPlanId={billingPlans.currentPlanId}
          isSubscriptionActive={billingPlans.isSubscriptionActive}
          currentTierRank={billingPlans.currentTierRank}
          scheduledChange={scheduledChange}
          hasRealPlans={billingPlans.hasRealPlans}
          checkoutLoading={checkoutLoading}
          freePlanLoading={freePlanLoading}
          onSelectPlan={billingPlans.handleSelectPlan}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <PaymentMethodCard activeSubscription={activeSubscription} />
          <InvoiceCard activeSubscription={activeSubscription} />
        </div>

        {paypal.pickerPlan && (
          <PaypalCheckoutModal
            plan={paypal.pickerPlan}
            onClose={paypal.closeCheckout}
            onCreateOrder={() => paypal.handleCreatePaypalOrder(paypal.pickerPlan!)}
            onApprove={paypal.handlePaypalApprove}
            onError={paypal.handlePaypalError}
          />
        )}

        {billingPlans.downgradeTarget && (
          <DowngradeConfirmModal
            fromName={billingPlans.currentPlanName}
            toPlan={billingPlans.downgradeTarget}
            endDate={activeSubscription?.endDate}
            loading={checkoutLoading || freePlanLoading}
            onClose={billingPlans.closeDowngrade}
            onConfirm={billingPlans.confirmDowngrade}
          />
        )}

        {paypal.paypalResult && (
          <PaypalModal
            result={paypal.paypalResult}
            loading={checkoutLoading}
            onClose={paypal.closeResult}
            onRetry={paypal.handleRetryPaypal}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
