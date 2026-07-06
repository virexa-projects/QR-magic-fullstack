import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type Gateway = "razorpay" | "stripe";
export type SubscriptionStatus = "pending" | "active" | "cancelled" | "failed";

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

export interface Subscription {
  _id: string;
  plan: Plan | string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  paymentGateway: Gateway | "manual";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
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
  error: string | null;
}

const initialState: BillingState = {
  plans: [],
  activeSubscription: null,
  history: [],
  razorpayOrder: null,
  loading: false,
  checkoutLoading: false,
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
        state.activeSubscription = action.payload;
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

      // cancel
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.activeSubscription = null;
      });
  },
});

export const { clearRazorpayOrder, clearBillingError } = billingSlice.actions;
export default billingSlice.reducer;