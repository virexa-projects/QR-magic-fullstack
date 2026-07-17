import type { ApiPlan, SubscriptionUsage } from "./billing.types";

// Fallback demo data so the pricing grid still renders something
// sensible if the plans API hasn't been hit yet / has no data in dev.
export const fallbackPlans: ApiPlan[] = [
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
export const freeUsageDefaults: SubscriptionUsage = {
  dynamicQrUsed: 0,
  dynamicQrLimit: 5,
  qrLimit: 20,
  scanLimitPerMonth: 1000,
  scansUsed: 0,           // NEW
  scansResetAt: undefined, // NEW
};

// --- Plan tier ranking ---------------------------------------------------
// Standard SaaS tier ladder. Used to decide whether picking a given plan
// counts as an "upgrade" or a "downgrade" relative to the user's current
// active subscription, and to gate downgrades behind a confirmation
// step (which schedules the change for end-of-period, rather than
// switching instantly).
export const PLAN_TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};
