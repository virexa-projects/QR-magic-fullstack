import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Sparkles, Zap, TrendingUp, Crown, ArrowRight, Info, X, Loader2, CalendarClock, ShieldCheck, RefreshCw, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { loadRazorpayScript } from "@/lib/Loadrazorpay";
import { toast } from "sonner";
import {
  fetchPlans,
  fetchActiveSubscription,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeCheckout,
  clearRazorpayOrder,
  switchToFreePlan,
  type Gateway,
  type Plan as ApiPlan,
} from "@/store/slices/Billingslice";
import { formatLimit, calculateUsage } from "@/lib/billing-format";

// NOTE: replace `any` with your real RootState / AppDispatch types if
// you have typed hooks (useAppDispatch / useAppSelector) set up.
type RootState = any;
type AppDispatch = any;

type BillingCycle = "monthly" | "yearly";

// Shape of the "plan" object as it comes back nested inside
// activeSubscription (from your sample payload). This is richer than
// the plain `ApiPlan` used for the pricing grid, so we type it
// separately instead of forcing a cast.
interface SubscriptionPlan {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  dynamicQrLimit?: number;
  qrLimit?: number;
  scanLimitPerMonth?: number;
  features?: string[];
  isActive?: boolean;
}

interface SubscriptionUsage {
  dynamicQrUsed: number;
  dynamicQrLimit: number;
  qrLimit: number;
  scanLimitPerMonth: number;
}

interface ActiveSubscription {
  _id: string;
  user: string;
  plan: SubscriptionPlan | string;
  status: "active" | "expired" | "cancelled" | "pending" | string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentGateway: Gateway | string;
  gatewayOrderId?: string;
  autoRenew: boolean;
  paymentId?: string;
  usage?: SubscriptionUsage;
  createdAt?: string;
  updatedAt?: string;
}

// Fallback demo data so the pricing grid still renders something
// sensible if the plans API hasn't been hit yet / has no data in dev.
const fallbackPlans: ApiPlan[] = [
  {
    _id: "free",
    name: "Free",
    tagline: "For trying things out",
    price: 0,
    currency: "INR",
    durationDays: 36500,
    isActive: true,
    features: [
      "Unlimited static QR codes",
      "All QR types (vCard, Wi-Fi, WhatsApp)",
      "PNG & SVG downloads",
      "5 dynamic QRs",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    tagline: "For small businesses",
    price: 299,
    currency: "INR",
    durationDays: 30,
    isActive: true,
    features: [
      "Unlimited dynamic QR codes",
      "Real-time scan analytics",
      "Logo & brand customization",
      "Bulk QR generation (CSV)",
      "PDF + high-res exports",
      "Priority email support",
    ],
  },
  {
    _id: "business",
    name: "Business",
    tagline: "For teams & brands",
    price: 999,
    currency: "INR",
    durationDays: 30,
    isActive: true,
    features: [
      "Team collaboration (5 seats)",
      "Advanced analytics & exports",
      "Custom domain",
      "API access",
      "Dedicated manager",
    ],
  },
];

// Sensible defaults for a user with no active subscription (free tier),
// so the usage card never breaks if activeSubscription is null.
const freeUsageDefaults: SubscriptionUsage = {
  dynamicQrUsed: 0,
  dynamicQrLimit: 5,
  qrLimit: 20,
  scanLimitPerMonth: 1000,
};

// --- Plan tier ranking ---------------------------------------------------
// Standard SaaS tier ladder. Used to decide whether picking a given plan
// counts as an "upgrade" or a "downgrade" relative to the user's current
// active subscription, and to gate downgrades (esp. to Free) behind a
// confirmation step instead of switching instantly.
const PLAN_TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

function tierRankOf(slugOrId?: string | null): number {
  if (!slugOrId) return 0;
  const key = slugOrId.toLowerCase();
  return key in PLAN_TIER_ORDER ? PLAN_TIER_ORDER[key] : 0;
}

function planKey(plan: { slug?: string; _id: string }): string {
  return (plan.slug ?? plan._id ?? "").toLowerCase();
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysRemaining(iso?: string) {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusBadgeClasses(status?: string) {
  switch (status) {
    case "active":
      return "bg-emerald/10 text-emerald border-emerald/30";
    case "expired":
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "pending":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-secondary text-muted-foreground border-border/60";
  }
}

function GatewayPickerModal({
  plan,
  onClose,
  onChoose,
  loading,
}: {
  plan: ApiPlan;
  onClose: () => void;
  onChoose: (gateway: Gateway) => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-semibold font-heading text-foreground">
          Pay for {plan.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose a payment method to continue. (Test mode — no real charge.)
        </p>

        <div className="mt-5 space-y-2.5">
          <Button
            disabled={loading}
            onClick={() => onChoose("razorpay")}
            className="w-full h-11 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white justify-between px-4"
          >
            Pay with Razorpay
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
          <Button
            disabled={loading}
            onClick={() => onChoose("stripe")}
            variant="outline"
            className="w-full h-11 rounded-xl justify-between px-4"
          >
            Pay with Stripe
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DowngradeConfirmModal({
  fromName,
  toPlan,
  endDate,
  loading,
  onClose,
  onConfirm,
}: {
  fromName: string;
  toPlan: ApiPlan;
  endDate?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <h3 className="text-base font-semibold font-heading text-foreground">
            Downgrade to {toPlan.name}?
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          You're moving from <span className="font-semibold text-foreground">{fromName}</span> down to{" "}
          <span className="font-semibold text-foreground">{toPlan.name}</span>. Some features and higher
          limits available on {fromName} won't be available after this change.
          {endDate && (
            <>
              {" "}Your current billing period runs until{" "}
              <span className="font-semibold text-foreground">{formatDate(endDate)}</span>.
            </>
          )}
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-full">
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 h-10 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm downgrade`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillingInner() {
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

  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pickerPlan, setPickerPlan] = useState<ApiPlan | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<ApiPlan | null>(null);

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

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchActiveSubscription());

    // Handle Stripe redirect back from the hosted checkout page.
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success") {
      toast.success("Payment received — activating your plan…");
      dispatch(fetchActiveSubscription());
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("stripe") === "cancelled") {
      toast("Checkout cancelled", { description: "No charge was made." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [dispatch]);

  async function handleRazorpay(plan: ApiPlan) {
    const result = await dispatch(createRazorpayOrder(plan._id));
    if (createRazorpayOrder.rejected.match(result)) return;

    const order = result.payload as {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      subscriptionId: string;
    };

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Couldn't load Razorpay checkout. Check your connection and try again.");
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Your App",
      description: `Upgrade to ${plan.name} (test mode)`,
      theme: { color: "#0f172a" },
      handler: async (response: any) => {
        await dispatch(
          verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscriptionId: order.subscriptionId,
          })
        );
        dispatch(fetchActiveSubscription());
        setPickerPlan(null);
      },
      modal: {
        ondismiss: () => {
          dispatch(clearRazorpayOrder());
        },
      },
    });

    rzp.open();
  }

  async function handleStripe(plan: ApiPlan) {
    const result = await dispatch(createStripeCheckout(plan._id));
    if (createStripeCheckout.rejected.match(result)) return;

    const { url } = result.payload as { url: string; sessionId: string };
    window.location.href = url;
  }

  function handleChooseGateway(gateway: Gateway) {
    if (!pickerPlan) return;
    if (gateway === "razorpay") handleRazorpay(pickerPlan);
    else handleStripe(pickerPlan);
  }

  // Free plans cost ₹0. We only allow switching to Free via the no-payment
  // backend path (switchToFreePlan) when the user ISN'T currently on an
  // active paid plan — see isFreeBlocked below, which disables the button
  // entirely in that case rather than letting it fire.
  async function handleSwitchToFree(plan: ApiPlan) {
    const result = await dispatch(switchToFreePlan(plan._id));
    if (switchToFreePlan.fulfilled.match(result)) {
      dispatch(fetchActiveSubscription());
    }
  }

  async function handleSelectPlan(plan: ApiPlan) {
    const targetRank = tierRankOf(planKey(plan));
    const isDowngrade = isSubscriptionActive && targetRank < currentTierRank;

    if (plan.price === 0) {
      // Free is only reachable from an unpaid/expired state — the button
      // itself is disabled while a paid plan is active (see isFreeBlocked),
      // this is just a defensive second guard.
      if (isSubscriptionActive && currentTierRank > 0) {
        toast.error(`Cancel or wait out your ${currentPlanName} plan first`, {
          description: `You're on an active paid plan until ${formatDate(activeSubscription?.endDate)}.`,
        });
        return;
      }
      await handleSwitchToFree(plan);
      return;
    }

    if (isDowngrade) {
      // Paid → lower paid tier (e.g. Business → Starter): confirm first,
      // since the user loses higher-tier limits/features immediately.
      setDowngradeTarget(plan);
      return;
    }

    setPickerPlan(plan);
  }

  async function confirmDowngrade() {
    if (!downgradeTarget) return;
    setPickerPlan(downgradeTarget);
    setDowngradeTarget(null);
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
                  ₹{activeSubscription.amount.toLocaleString("en-IN")} /{" "}
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
      <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 items-center">
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
                  className={`h-full rounded-full transition-all ${
                    nearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
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

          <div className="md:border-l md:border-border/60 md:pl-10">
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
                <div className="text-2xl font-bold font-heading text-foreground flex items-center gap-1">
                  {formatLimit(usage.scanLimitPerMonth)}
                  <TrendingUp className="w-4 h-4 text-emerald" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Scans / month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans header with billing toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold font-heading text-foreground">
            Choose the right plan
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasRealPlans
              ? "Upgrade or downgrade anytime. Prorated to the day."
              : "Loading plans from the server…"}
          </p>
        </div>
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
          <TabsList className="bg-secondary p-1 rounded-full h-9">
            <TabsTrigger
              value="monthly"
              className="rounded-full px-4 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="rounded-full px-4 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Yearly
              <span className="ml-1.5 text-[10px] font-bold text-emerald">−17%</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plan grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan: ApiPlan, idx: number) => {
          const isCurrent = plan._id === currentPlanId && isSubscriptionActive;
          const isPopular = idx === 1; // middle plan highlighted, same as original design
          const price = cycle === "monthly" ? plan.price : Math.round(plan.price * 10); // simple yearly approximation
          const period = cycle === "monthly" ? "/mo" : "/yr";

          const targetRank = tierRankOf(planKey(plan));
          const isDowngrade = !isCurrent && isSubscriptionActive && targetRank < currentTierRank;
          const isUpgrade = !isCurrent && (!isSubscriptionActive || targetRank > currentTierRank);

          // Standard SaaS rule: while any paid plan (Starter/Pro/Business) is
          // active, block the Free-plan button entirely instead of allowing
          // an instant downgrade to Free. The user needs to let their paid
          // term run out (or you can wire in a cancel-at-period-end flow)
          // before Free becomes selectable again.
          const isFreeBlocked = plan.price === 0 && isSubscriptionActive && currentTierRank > 0 && !isCurrent;

          const isDisabled =
            isCurrent || checkoutLoading || freePlanLoading || !hasRealPlans || isFreeBlocked;

          let buttonLabel: React.ReactNode;
          if (isCurrent) {
            buttonLabel = "Your current plan";
          } else if (isFreeBlocked) {
            buttonLabel = "Unavailable on active plan";
          } else if (plan.price === 0 && freePlanLoading) {
            buttonLabel = <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
          } else if (plan.price === 0) {
            buttonLabel = "Switch to Free";
          } else if (isDowngrade) {
            buttonLabel = (
              <span className="inline-flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5" /> Downgrade to {plan.name}
              </span>
            );
          } else {
            buttonLabel = `Upgrade to ${plan.name}`;
          }

          return (
            <div
              key={plan._id}
              className={`relative rounded-2xl p-6 border bg-card transition-all ${
                isPopular
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
                {isDowngrade && !isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                    Downgrade
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-heading text-foreground">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {price === 0 ? "forever" : period}
                </span>
              </div>

              <Button
                disabled={isDisabled}
                onClick={() => handleSelectPlan(plan)}
                title={
                  isFreeBlocked
                    ? `Cancel or wait out your ${currentPlanName} plan first`
                    : !hasRealPlans
                    ? "Plans are still loading — please wait"
                    : undefined
                }
                className={`w-full mt-5 h-10 rounded-full font-semibold ${
                  isPopular
                    ? "bg-emerald hover:bg-emerald/90 text-emerald-foreground"
                    : isCurrent
                    ? "bg-secondary text-muted-foreground hover:bg-secondary cursor-default"
                    : isFreeBlocked
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
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
        <GatewayPickerModal
          plan={pickerPlan}
          loading={checkoutLoading}
          onClose={() => setPickerPlan(null)}
          onChoose={handleChooseGateway}
        />
      )}

      {downgradeTarget && (
        <DowngradeConfirmModal
          fromName={currentPlanName}
          toPlan={downgradeTarget}
          endDate={activeSubscription?.endDate}
          loading={checkoutLoading}
          onClose={() => setDowngradeTarget(null)}
          onConfirm={confirmDowngrade}
        />
      )}
    </div>
  );
}

export default function BillingContent() {
  return (
    <DashboardLayout>
      <BillingInner />
    </DashboardLayout>
  );
}