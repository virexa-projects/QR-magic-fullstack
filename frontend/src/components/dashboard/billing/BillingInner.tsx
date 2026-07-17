import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Sparkles, Zap, TrendingUp, Crown, ArrowRight, Info, Loader2, CalendarClock, ShieldCheck, RefreshCw, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PaypalModal, { type PaypalResult } from "@/components/dashboard/billing/PaypalModal";
import {
  fetchPlans,
  fetchActiveSubscription,
  createPaypalOrder,
  capturePaypalOrder,
  clearPaypalOrder,
  switchToFreePlan,
  cancelScheduledChange,
} from "@/store/slices/Billingslice";
import { formatLimit, calculateUsage } from "@/lib/billing-format";
import type { ApiPlan, AppDispatch, RootState, ActiveSubscription, SubscriptionPlan, SubscriptionUsage } from "./billing.types";
import { fallbackPlans, freeUsageDefaults } from "./billing.constants";
import { tierRankOf, planKey, formatDate, daysRemaining, statusBadgeClasses } from "./billing.utils";
import { PaypalCheckoutModal } from "./PaypalCheckoutModal";
import { DowngradeConfirmModal } from "./DowngradeConfirmModal";

export function BillingInner() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    plans: apiPlans,
    activeSubscription,
    checkoutLoading,
    freePlanLoading,
  }: {
    plans: ApiPlan[];
    activeSubscription: ActiveSubscription | null;
    checkoutLoading: boolean;
    freePlanLoading: boolean;
  } = useSelector((state: RootState) => state.billing);

  const [pickerPlan, setPickerPlan] = useState<ApiPlan | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<ApiPlan | null>(null);
  const [cancelScheduleLoading, setCancelScheduleLoading] = useState(false);

  // Post-checkout result modal (processing / success / scheduled / error).
  // Lives here, not inside PaypalCheckoutModal, because that modal is
  // closed the instant onApprove fires — its state would be gone right
  // when we need to show the outcome.
  const [paypalResult, setPaypalResult] = useState<PaypalResult | null>(null);
  const retryPlanRef = useRef<ApiPlan | null>(null);

  const hasRealPlans = apiPlans && apiPlans.length > 0;
  const plans = hasRealPlans ? apiPlans : fallbackPlans;

  // The plan can come back either populated (object) or as a bare id
  // string depending on how the API responds — handle both.
  const subscriptionPlan: SubscriptionPlan | null =
    activeSubscription && typeof activeSubscription.plan === "object"
      ? (activeSubscription.plan as SubscriptionPlan)
      : null;

  const currentPlanId =
    typeof activeSubscription?.plan === "string"
      ? activeSubscription.plan
      : subscriptionPlan?._id ?? "free";

  const currentPlanName =
    plans.find((p: ApiPlan) => p._id === currentPlanId)?.name ??
    subscriptionPlan?.name ??
    "Free";

  const isSubscriptionActive = activeSubscription?.status === "active";
  const scheduledChange = activeSubscription?.scheduledChange ?? null;

  // Tier rank of whatever the user is actively paying for right now.
  // If there's no active paid subscription, they're effectively on Free (rank 0),
  // so every plan in the grid reads as an upgrade.
  const currentTierRank = useMemo(() => {
    if (!isSubscriptionActive) return 0;
    const key = subscriptionPlan?.slug ?? currentPlanId;
    return tierRankOf(key);
  }, [isSubscriptionActive, subscriptionPlan, currentPlanId]);

  // Real usage numbers, falling back to sensible free-tier defaults
  // when there's no active subscription yet.
  const usage: SubscriptionUsage = activeSubscription?.usage ?? freeUsageDefaults;

  const dynamicQrUsage = calculateUsage(usage.dynamicQrUsed, usage.dynamicQrLimit);
  const nearLimit = !dynamicQrUsage.isUnlimited && dynamicQrUsage.percentage >= 80;

  const remainingDays = daysRemaining(activeSubscription?.endDate);
  const scanUsage = calculateUsage(usage.scansUsed ?? 0, usage.scanLimitPerMonth);
  const scanNearLimit = !scanUsage.isUnlimited && scanUsage.percentage >= 80;
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

  // Step 1: ask the backend to create a PayPal order for this plan,
  // stash the subscriptionId so onApprove can pass it to /capture.
  const pendingSubscriptionIdRef = useRef<string | null>(null);

  async function handleCreatePaypalOrder(plan: ApiPlan): Promise<string> {
    const result = await dispatch(createPaypalOrder(plan._id));
    if (createPaypalOrder.rejected.match(result)) {
      throw new Error((result.payload as string) || "Failed to create PayPal order");
    }
    const order = result.payload as { orderId: string; subscriptionId: string };
    pendingSubscriptionIdRef.current = order.subscriptionId;
    return order.orderId;
  }

  // Step 2: buyer approved in the PayPal popup -> capture server-side.
  async function handlePaypalApprove(orderId: string) {
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

    const capturingPlan = pickerPlan;
    retryPlanRef.current = capturingPlan;

    // Close the PayPal buttons modal and show "processing" immediately —
    // capture can take a couple seconds and the buyer just left the
    // PayPal popup, so a blank gap here reads as broken.
    setPickerPlan(null);
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
          fromPlanName: currentPlanName,
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
  }

  function handlePaypalError(message: string) {
    retryPlanRef.current = pickerPlan;
    setPickerPlan(null);
    setPaypalResult({ status: "error", message, retryable: true });
  }

  function handleRetryPaypal() {
    const plan = retryPlanRef.current;
    setPaypalResult(null);
    if (plan) {
      setPickerPlan(plan); // reopens PaypalCheckoutModal for the same plan
    }
  }

  // Free plans cost ₹0. switchToFreePlan on the backend schedules the
  // switch for end-of-period if a paid plan is currently active,
  // instead of applying it instantly — see handleSelectPlan below.
  async function handleSwitchToFree(plan: ApiPlan) {
    const result = await dispatch(switchToFreePlan(plan._id));
    if (switchToFreePlan.fulfilled.match(result)) {
      dispatch(fetchActiveSubscription());
      if (isSubscriptionActive && currentTierRank > 0) {
        toast.success(`Free scheduled to start when your ${currentPlanName} plan ends`);
      }
    }
  }

  async function handleSelectPlan(plan: ApiPlan) {
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

    setPickerPlan(plan);
  }

  async function confirmDowngrade() {
    if (!downgradeTarget) return;
    if (downgradeTarget.price === 0) {
      await handleSwitchToFree(downgradeTarget);
      setDowngradeTarget(null);
      return;
    }
    setPickerPlan(downgradeTarget);
    setDowngradeTarget(null);
  }

  async function handleCancelScheduledChange() {
    setCancelScheduleLoading(true);
    try {
      const result = await dispatch(cancelScheduledChange());
      if (cancelScheduledChange.fulfilled.match(result)) {
        toast.success("Scheduled plan change cancelled");
        dispatch(fetchActiveSubscription());
      }
    } finally {
      setCancelScheduleLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold font-heading text-foreground tracking-tight">
            Plan & billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription, usage and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubscription && (
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusBadgeClasses(
                activeSubscription.status
              )}`}
            >
              {activeSubscription.status}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[11px] font-semibold bg-secondary border-border/60 text-muted-foreground uppercase tracking-wider"
          >
            Current plan · {currentPlanName}
          </Badge>
        </div>
      </div>

      {/* Scheduled change banner — shown whenever a downgrade is pending */}
      {scheduledChange && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-foreground">
            <CalendarClock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <span>
              Switching to <span className="font-semibold">{scheduledChange.planName}</span> on{" "}
              <span className="font-semibold">{formatDate(scheduledChange.effectiveDate)}</span>.
              You'll keep {currentPlanName} until then.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={cancelScheduleLoading}
            onClick={handleCancelScheduledChange}
            className="h-8 rounded-full text-xs shrink-0"
          >
            {cancelScheduleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel change"}
          </Button>
        </div>
      )}

      {/* Subscription summary — only shown when there's a real, paid subscription */}
      {activeSubscription && subscriptionPlan && (
        <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {subscriptionPlan.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {activeSubscription.currency === "INR" ? "₹" : "$"}
                  {activeSubscription.amount.toLocaleString("en-US")} /{" "}
                  {subscriptionPlan.durationDays >= 365 ? "yr" : "mo"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <CalendarClock className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Renews / expires
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {formatDate(activeSubscription.endDate)}
                </div>
                {remainingDays !== null && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {remainingDays > 0 ? `${remainingDays} days left` : "Expired"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Auto-renew
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {activeSubscription.autoRenew ? "On" : "Off"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                  via {activeSubscription.paymentGateway}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Started
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {formatDate(activeSubscription.startDate)}
                </div>
                {activeSubscription.paymentId && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                    {activeSubscription.paymentId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Usage card */}
      {/* Usage card */}
      <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card space-y-6">
        {/* Dynamic QR usage */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Zap className="w-3.5 h-3.5" /> Dynamic QR usage
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">
              {dynamicQrUsage.label}
            </span>
          </div>

          <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
            {dynamicQrUsage.isUnlimited ? (
              <div className="h-full rounded-full bg-emerald/30" style={{ width: "100%" }} />
            ) : (
              <div
                className={`h-full rounded-full transition-all ${nearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
                  }`}
                style={{ width: `${dynamicQrUsage.percentage}%` }}
              />
            )}
          </div>

          {nearLimit && (
            <div className="mt-3 flex items-start gap-2 text-xs text-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
              <span>
                You've hit your limit. New dynamic QRs are paused until you upgrade or
                delete unused ones.
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-border/60" />

        {/* Scans / month usage */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Scans this month
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">
              {scanUsage.label}
            </span>
          </div>

          <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
            {scanUsage.isUnlimited ? (
              <div className="h-full rounded-full bg-emerald/30" style={{ width: "100%" }} />
            ) : (
              <div
                className={`h-full rounded-full transition-all ${scanNearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
                  }`}
                style={{ width: `${scanUsage.percentage}%` }}
              />
            )}
          </div>

          {scanNearLimit && usage.scansResetAt && (
            <div className="mt-3 flex items-start gap-2 text-xs text-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
              <span>
                {scanUsage.percentage >= 100
                  ? "You've used all your scans for this month. Scanning still works for visitors, but tracking pauses"
                  : "You're close to your monthly scan limit"}{" "}
                until it resets on{" "}
                <span className="font-semibold">{formatDate(usage.scansResetAt)}</span>.
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 pt-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Plan limits
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold font-heading text-foreground">
                {formatLimit(usage.qrLimit)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Total QR codes</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-heading text-foreground">
                {formatLimit(usage.scanLimitPerMonth)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Scans / month cap</div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold font-heading text-foreground">
            Choose the right plan
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasRealPlans
              ? "Upgrade anytime — takes effect immediately. Downgrades take effect at the end of your current billing period."
              : "Loading plans from the server…"}
          </p>
        </div>
      </div>

      {/* Plan grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan: ApiPlan, idx: number) => {
          const isCurrent = plan._id === currentPlanId && isSubscriptionActive;
          const isPopular = idx === 1; // middle plan highlighted, same as original design
          const price = plan.price;

          const targetRank = tierRankOf(planKey(plan));
          const isDowngrade = !isCurrent && isSubscriptionActive && targetRank < currentTierRank;
          const isUpgrade = !isCurrent && (!isSubscriptionActive || targetRank > currentTierRank);

          // This plan is exactly what's already scheduled to take over —
          // show it as pending rather than offering to pick it again.
          const isAlreadyScheduled = scheduledChange?.planName === plan.name;

          const isDisabled =
            isCurrent ||
            isAlreadyScheduled ||
            checkoutLoading ||
            freePlanLoading ||
            !hasRealPlans;

          let buttonLabel: React.ReactNode;
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
              key={plan._id}
              className={`relative rounded-2xl p-6 border bg-card transition-all ${isPopular
                  ? "border-emerald/40 shadow-emerald ring-1 ring-emerald/20"
                  : "border-border/60 shadow-card"
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
                    <h3 className="text-base font-semibold font-heading text-foreground">
                      {plan.name}
                    </h3>
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
                <span className="text-xs text-muted-foreground">
                  {price === 0 ? "forever" : "/mo"}
                </span>
              </div>

              <Button
                disabled={isDisabled}
                onClick={() => handleSelectPlan(plan)}
                title={!hasRealPlans ? "Plans are still loading — please wait" : undefined}
                className={`w-full mt-5 h-10 rounded-full font-semibold ${isPopular
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
        })}
      </div>

      {/* Invoices / payment method row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold font-heading text-foreground">Payment method</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
              Add card
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeSubscription
              ? `Last charged via ${activeSubscription.paymentGateway}. Add a card to enable auto-renewal.`
              : "No card on file. Add a payment method to enable auto-renewal."}
          </p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold font-heading text-foreground">Invoices</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
              View all
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeSubscription
              ? `Payment ID ${activeSubscription.paymentId ?? "—"} · ${formatDate(
                activeSubscription.createdAt
              )}`
              : "No invoices yet. They'll appear here after your first payment."}
          </p>
        </div>
      </div>

      {pickerPlan && (
        <PaypalCheckoutModal
          plan={pickerPlan}
          onClose={() => setPickerPlan(null)}
          onCreateOrder={() => handleCreatePaypalOrder(pickerPlan)}
          onApprove={handlePaypalApprove}
          onError={handlePaypalError}
        />
      )}

      {downgradeTarget && (
        <DowngradeConfirmModal
          fromName={currentPlanName}
          toPlan={downgradeTarget}
          endDate={activeSubscription?.endDate}
          loading={checkoutLoading || freePlanLoading}
          onClose={() => setDowngradeTarget(null)}
          onConfirm={confirmDowngrade}
        />
      )}

      {paypalResult && (
        <PaypalModal
          result={paypalResult}
          loading={checkoutLoading}
          onClose={() => setPaypalResult(null)}
          onRetry={handleRetryPaypal}
        />
      )}
    </div>
  );
}