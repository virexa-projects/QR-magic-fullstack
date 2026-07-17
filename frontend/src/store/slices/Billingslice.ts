import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type Gateway = "paypal";
export type SubscriptionStatus = "pending" | "active" | "cancelled" | "failed" | "scheduled" | "expired";

export interface PaypalQuote {
  amount: number;
  currency: string;
  originalAmount: number;
  originalCurrency: string;
  rate: number;
}

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

interface PaypalOrderPayload {
  orderId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  originalAmount: number;
  originalCurrency: string;
  conversionRate: number | null;
}

interface BillingState {
  plans: Plan[];
  activeSubscription: Subscription | null;
  history: Subscription[];
  paypalOrder: PaypalOrderPayload | null;
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
  paypalOrder: null,
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

/**
 * Preview the converted PayPal amount BEFORE the user commits to
 * checkout. Does not create a real PayPal order — just calls the
 * backend's currency-conversion helper so the modal can show
 * "≈ $3.61 USD" before the buttons render.
 */
export const fetchPaypalQuote = createAsyncThunk(
  "billing/fetchPaypalQuote",
  async (planId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/billing/paypal/quote/${planId}`);
      return res.data.data as PaypalQuote;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch price quote");
    }
  }
);

/** Step 1 of PayPal flow — create the order server-side (locks in the real charge amount). */
export const createPaypalOrder = createAsyncThunk(
  "billing/createPaypalOrder",
  async (planId: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/paypal/create-order", { planId });
      return res.data.data as PaypalOrderPayload;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to start PayPal checkout";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/** Step 2 of PayPal flow — capture after the buyer approves in the popup. */
export const capturePaypalOrder = createAsyncThunk(
  "billing/capturePaypalOrder",
  async (payload: { orderId: string; subscriptionId: string }, { rejectWithValue }) => {
    try {
      const res = await api.post("/billing/paypal/capture", payload);
      toast.success("Payment successful. Plan upgraded!");
      return res.data.data as Subscription;
    } catch (err: any) {
      const message = err.response?.data?.message || "Payment capture failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * No-gateway plan switch, used for Free (price === 0) plans only. The
 * backend rejects any plan with price > 0. If the user has an active
 * paid plan, the backend SCHEDULES the switch for end-of-period.
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
    clearPaypalOrder: (state) => {
      state.paypalOrder = null;
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

      // paypal order
      .addCase(createPaypalOrder.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(createPaypalOrder.fulfilled, (state, action) => {
        state.paypalOrder = action.payload;
        state.checkoutLoading = false;
      })
      .addCase(createPaypalOrder.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      })

      // paypal capture
      .addCase(capturePaypalOrder.pending, (state) => {
        state.checkoutLoading = true;
      })
      .addCase(capturePaypalOrder.fulfilled, (state, action) => {
        // A downgrade capture returns the SCHEDULED row, not a change
        // to the currently-active subscription — don't stomp it here.
        // The component dispatches fetchActiveSubscription right after.
        if (action.payload.status !== "scheduled") {
          state.activeSubscription = action.payload;
        }
        state.paypalOrder = null;
        state.checkoutLoading = false;
      })
      .addCase(capturePaypalOrder.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      })

      // free plan switch
      .addCase(switchToFreePlan.pending, (state) => {
        state.freePlanLoading = true;
      })
      .addCase(switchToFreePlan.fulfilled, (state, action) => {
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

export const { clearPaypalOrder, clearBillingError } = billingSlice.actions;
export default billingSlice.reducer;