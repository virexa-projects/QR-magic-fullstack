import { useState } from "react";
import { Check, Sparkles, Zap, TrendingUp, Crown, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "For trying things out",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Unlimited static QR codes",
      "All QR types (vCard, Wi-Fi, WhatsApp)",
      "PNG & SVG downloads",
      "5 dynamic QRs",
    ],
    limits: { dynamic: 5, scans: "1k / month" },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For small businesses",
    priceMonthly: 299,
    priceYearly: 2990,
    features: [
      "Unlimited dynamic QR codes",
      "Real-time scan analytics",
      "Logo & brand customization",
      "Bulk QR generation (CSV)",
      "PDF + high-res exports",
      "Priority email support",
    ],
    limits: { dynamic: "Unlimited", scans: "100k / month" },
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams & brands",
    priceMonthly: 999,
    priceYearly: 9990,
    features: [
      "Team collaboration (5 seats)",
      "Advanced analytics & exports",
      "Custom domain",
      "API access",
      "Dedicated manager",
    ],
    limits: { dynamic: "Unlimited", scans: "1M / month" },
  },
];

const currentPlanId = "free";
const usage = { used: 5, total: 5 };

function BillingInner() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const usagePct = Math.min(100, (usage.used / usage.total) * 100);
  const nearLimit = usagePct >= 80;

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
        <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold bg-secondary border-border/60 text-muted-foreground uppercase tracking-wider">
          Current plan · Free
        </Badge>
      </div>

      {/* Usage card — loss aversion + goal gradient */}
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
            Upgrade or downgrade anytime. Prorated to the day.
          </p>
        </div>
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
          <TabsList className="bg-secondary p-1 rounded-full h-9">
            <TabsTrigger value="monthly" className="rounded-full px-4 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="rounded-full px-4 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Yearly
              <span className="ml-1.5 text-[10px] font-bold text-emerald">−17%</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plan grid — inline, dashboard-native */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = !!plan.popular;
          const price = cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const period = cycle === "monthly" ? "/mo" : "/yr";

          return (
            <div
              key={plan.id}
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
                    {plan.id === "business" && <Crown className="w-3.5 h-3.5 text-warning" />}
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
                <span className="text-xs text-muted-foreground">{price === 0 ? "forever" : period}</span>
              </div>

              <Button
                disabled={isCurrent}
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
                {plan.features.map((f) => (
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
