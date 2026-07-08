import { z } from "zod";

// NOTE: shaped to match the same convention as createSubscriptionSchema
// in analytics.validator.ts. If your `validate` middleware expects a
// plain (non body-wrapped) schema instead, drop the outer `body: {}`.

export const razorpayOrderSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "planId is required"),
  }),
});

export const razorpayVerifySchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
    razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
    razorpay_signature: z.string().min(1, "razorpay_signature is required"),
    subscriptionId: z.string().min(1, "subscriptionId is required"),
  }),
});

export const stripeCheckoutSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "planId is required"),
  }),
});
export const subscribeFreeSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "planId is required"),
  }),
});