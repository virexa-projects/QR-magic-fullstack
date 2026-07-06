import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Sparkles, Zap, TrendingUp, Crown, ArrowRight, Info, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { loadRazorpayScript } from "@/lib/loadRazorpay";
import { toast } from "sonner";
import {
  fetchPlans,
  fetchActiveSubscription,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeCheckout,
  clearRazorpayOrder,
  type Gateway,
  type Plan as ApiPlan,
} from "@/store/slices/billingSlice";

// NOTE: replace `any` with your real RootState / AppDispatch types if
// you have typed hooks (useAppDispatch / useAppSelector) set up.
type RootState = any;
type AppDispatch = any;

type BillingCycle = "monthly" | "yearly";

// Fallback demo data so the page still renders something sensible if
// the plans API hasn't been hit yet / has no data in dev.
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

const usage = { used: 5, total: 5 };

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

function BillingInner() {
  const dispatch = useDispatch<AppDispatch>();
  const { plans: apiPlans, activeSubscription, razorpayOrder, checkoutLoading } = useSelector(
    (state: RootState) => state.billing
  );

  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pickerPlan, setPickerPlan] = useState<ApiPlan | null>(null);

  const hasRealPlans = apiPlans && apiPlans.length > 0;
  const plans = hasRealPlans ? apiPlans : fallbackPlans;
  const currentPlanId =
    typeof activeSubscription?.plan === "string"
      ? activeSubscription.plan
      : activeSubscription?.plan?._id ?? "free";

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

  const usagePct = Math.min(100, (usage.used / usage.total) * 100);
  const nearLimit = usagePct >= 80;

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
    window.location.href = url; // hand off to Stripe's hosted checkout page
  }

  function handleChooseGateway(gateway: Gateway) {
    if (!pickerPlan) return;
    if (gateway === "razorpay") handleRazorpay(pickerPlan);
    else handleStripe(pickerPlan);
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
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-[11px] font-semibold bg-secondary border-border/60 text-muted-foreground uppercase tracking-wider"
        >
          Current plan ·{" "}
          {plans.find((p: ApiPlan) => p._id === currentPlanId)?.name ?? "Free"}
        </Badge>
      </div>

      {/* Usage card */}
      <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-7 shadow-card">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Zap className="w-3.5 h-3.5" /> Dynamic QR usage
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-heading text-foreground">{usage.used}</span>
              <span className="text-base text-muted-foreground">of {usage.total} used</span>
            </div>

            <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  nearLimit ? "bg-gradient-to-r from-warning to-destructive" : "bg-emerald"
                }`}
                style={{ width: `${usagePct}%` }}
              />
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
              This month
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold font-heading text-foreground">1,284</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total scans</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-heading text-foreground flex items-center gap-1">
                  +28%
                  <TrendingUp className="w-4 h-4 text-emerald" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">vs last month</div>
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
          const isCurrent = plan._id === currentPlanId;
          const isPopular = idx === 1; // middle plan highlighted, same as original design
          const price = cycle === "monthly" ? plan.price : Math.round(plan.price * 10); // simple yearly approximation
          const period = cycle === "monthly" ? "/mo" : "/yr";

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
                disabled={isCurrent || checkoutLoading || !hasRealPlans}
                onClick={() => setPickerPlan(plan)}
                title={!hasRealPlans ? "Plans are still loading — please wait" : undefined}
                className={`w-full mt-5 h-10 rounded-full font-semibold ${
                  isPopular
                    ? "bg-emerald hover:bg-emerald/90 text-emerald-foreground"
                    : isCurrent
                    ? "bg-secondary text-muted-foreground hover:bg-secondary cursor-default"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {isCurrent ? "Your current plan" : `Upgrade to ${plan.name}`}
                {!isCurrent && <ArrowRight className="w-4 h-4 ml-1.5" />}
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
            No card on file. Add a payment method to enable auto-renewal.
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
            No invoices yet. They'll appear here after your first payment.
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