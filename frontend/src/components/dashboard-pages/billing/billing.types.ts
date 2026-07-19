import type { Gateway, Plan as ApiPlan } from "@/store/slices/Billingslice";

export type { ApiPlan, Gateway };

// NOTE: replace `any` with your real RootState / AppDispatch types if
// you have typed hooks (useAppDispatch / useAppSelector) set up.
export type RootState = any;
export type AppDispatch = any;

export interface SubscriptionPlan {
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

export interface SubscriptionUsage {
  dynamicQrUsed: number;
  dynamicQrLimit: number;
  qrLimit: number;
  scanLimitPerMonth: number;
  scansUsed?: number;
  scansResetAt?: string;
}

// Surfaced by getActiveSubscription when a downgrade is pending —
// the user's current plan is untouched until effectiveDate arrives.
export interface ScheduledChange {
  planName: string;
  effectiveDate: string;
}

export interface ActiveSubscription {
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
  scheduledChange?: ScheduledChange | null;
  createdAt?: string;
  updatedAt?: string;
}
