import { memo } from "react";
import { ShieldCheck, CalendarClock, RefreshCw, Zap } from "lucide-react";
import { formatDate, daysRemaining } from "../billing.utils";
import type { ActiveSubscription, SubscriptionPlan } from "../billing.types";

interface SubscriptionSummaryProps {
  activeSubscription: ActiveSubscription;
  subscriptionPlan: SubscriptionPlan;
}

function SubscriptionSummaryBase({ activeSubscription, subscriptionPlan }: SubscriptionSummaryProps) {
  const remainingDays = daysRemaining(activeSubscription.endDate);

  return (
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
            <div className="text-sm font-semibold text-foreground mt-0.5">{subscriptionPlan.name}</div>
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
  );
}

export const SubscriptionSummary = memo(SubscriptionSummaryBase);
