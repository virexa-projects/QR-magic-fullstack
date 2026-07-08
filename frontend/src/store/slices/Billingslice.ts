import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type Gateway = "razorpay" | "stripe";
export type SubscriptionStatus = "pending" | "active" | "cancelled" | "failed" | "scheduled" | "expired";

export interface Plan {
  _id: string;
  name: string;
  tagline?: string;
  price: number;
  currency: string;
  durationDays: number;
  features?: string[];
  isActive: boolean;
}

// Surfaced by GET /billing/active when a downgrade is pending — the
// user's current plan is untouched until effectiveDate arrives, at
// which point the backend cron flips this subscription over.
export interface ScheduledChange {
  planName: string;
  effectiveDate: string;
}

export interface Subscription {
  _id: string;
  plan: Plan | string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  paymentGateway: Gateway | "manual" | "free";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  scheduledChange?: ScheduledChange | null;
}

interface RazorpayOrderPayload {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  subscriptionId: string;
}

interface BillingState {
  plans: Plan[];
  activeSubscription: Subscription | null;
  history: Subscription[];
  razorpayOrder: RazorpayOrderPayload | null;
  loading: boolean;
  checkoutLoading: boolean;
  freePlanLoading: boolean;
  cancelScheduleLoading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  plans: [],
  activeSubscription: null,
  history: [],
  razorpayOrder: null,
  loading: false,
  checkoutLoading: false,
  freePlanLoading: false,
  cancelScheduleLoading: false,
  error: null,
};

export const fetchPlans = createAsyncThunk("billing/fetchPlans", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/billing/plans");
    return res.data.data as Plan[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to load plans");
  }
});

export const fetchActiveSubscription = createAsyncThunk(
  "billing/fetchActiveSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/billing/active");
      return (res.data.data as Subscription) ?? null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load subscription");
    }
  }
);

export const fetchBillingHistory = createAsyncThunk(
  "billing/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/billing/history");
      return res.data.data as Subscription[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load history");
    }
  }
);

/** Step 1 of Razorpay flow — create the order server-side. */
export const createRazorpayOrder = createAsyncThunk(
  "billing/createRazorpayOrder",
  async (planId: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/razorpay/create-order", { planId });
      return res.data.data as RazorpayOrderPayload;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to start Razorpay checkout";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/** Step 2 of Razorpay flow — verify the signature returned by the widget. */
export const verifyRazorpayPayment = createAsyncThunk(
  "billing/verifyRazorpayPayment",
  async (
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      subscriptionId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/billing/razorpay/verify", payload);
      toast.success("Payment successful. Plan upgraded!");
      return res.data.data as Subscription;
    } catch (err: any) {
      const message = err.response?.data?.message || "Payment verification failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/** Stripe flow — create a hosted checkout session, then redirect to it. */
export const createStripeCheckout = createAsyncThunk(
  "billing/createStripeCheckout",
  async (planId: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/stripe/create-checkout-session", { planId });
      return res.data.data as { url: string; sessionId: string };
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to start Stripe checkout";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * No-gateway plan switch, used for Free (price === 0) plans only. The
 * backend (`switchToFreePlan` service) rejects any plan with price > 0,
 * so this can't be used to sneak a paid plan for free.
 *
 * NOTE: if the user has an active paid plan, the backend now SCHEDULES
 * the switch for end-of-period instead of applying it instantly — the
 * returned Subscription in that case is the SCHEDULED row, not a
 * change to activeSubscription itself. See the fulfilled reducer below.
 */
export const switchToFreePlan = createAsyncThunk(
  "billing/switchToFreePlan",
  async (planId: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/subscribe-free", { planId });
      const subscription = res.data.data as Subscription;
      if (subscription.status === "scheduled") {
        toast.success("Free plan scheduled for the end of your current billing period.");
      } else {
        toast.success("Switched to the Free plan.");
      }
      return subscription;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to switch to the Free plan";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  "billing/cancelSubscription",
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const res = await api.post(`/billing/cancel/${subscriptionId}`);
      toast.success("Subscription cancelled");
      return res.data.data as Subscription;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to cancel subscription";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Lets a user back out of a pending SCHEDULED downgrade before it takes
 * effect. Their current active plan is unaffected either way — this
 * only cancels the queued-up change, not what's currently active.
 */
export const cancelScheduledChange = createAsyncThunk(
  "billing/cancelScheduledChange",
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/scheduled/cancel");
      toast.success("Scheduled plan change cancelled");
      return res.data.data as Subscription;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to cancel the scheduled change";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    clearRazorpayOrder: (state) => {
      state.razorpayOrder = null;
    },
    clearBillingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // plans
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlans.fulfilled, (state, action: PayloadAction<Plan[]>) => {
        state.plans = action.payload;
        state.loading = false;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // active subscription
      .addCase(fetchActiveSubscription.fulfilled, (state, action) => {
        state.activeSubscription = action.payload;
      })

      // history
      .addCase(fetchBillingHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      // razorpay order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.razorpayOrder = action.payload;
        state.checkoutLoading = false;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      })

      // razorpay verify
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        // If this payment was a downgrade, the backend scheduled it
        // instead of activating it — don't stomp the currently active
        // subscription with the scheduled row. A fetchActiveSubscription
        // dispatch right after this (already done in the component)
        // will pick up both the still-active plan and its scheduledChange.
        if (action.payload.status !== "scheduled") {
          state.activeSubscription = action.payload;
        }
        state.razorpayOrder = null;
      })

      // stripe checkout
      .addCase(createStripeCheckout.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(createStripeCheckout.fulfilled, (state) => {
        state.checkoutLoading = false;
        // Actual redirect (window.location.href = url) happens in the
        // component right after this thunk resolves.
      })
      .addCase(createStripeCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      })

      // free plan switch
      .addCase(switchToFreePlan.pending, (state) => {
        state.freePlanLoading = true;
      })
      .addCase(switchToFreePlan.fulfilled, (state, action) => {
        // Same reasoning as verifyRazorpayPayment.fulfilled above: a
        // scheduled Free switch shouldn't overwrite the still-active
        // paid subscription in state.
        if (action.payload.status !== "scheduled") {
          state.activeSubscription = action.payload;
        }
        state.freePlanLoading = false;
      })
      .addCase(switchToFreePlan.rejected, (state, action) => {
        state.freePlanLoading = false;
        state.error = action.payload as string;
      })

      // cancel
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.activeSubscription = null;
      })

      // cancel a pending scheduled change (does not touch the active plan)
      .addCase(cancelScheduledChange.pending, (state) => {
        state.cancelScheduleLoading = true;
      })
      .addCase(cancelScheduledChange.fulfilled, (state) => {
        state.cancelScheduleLoading = false;
        if (state.activeSubscription) {
          state.activeSubscription.scheduledChange = null;
        }
      })
      .addCase(cancelScheduledChange.rejected, (state, action) => {
        state.cancelScheduleLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRazorpayOrder, clearBillingError } = billingSlice.actions;
export default billingSlice.reducer;