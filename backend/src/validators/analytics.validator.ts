import { z } from "zod";

export const analyticsRangeSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    qrId: z.string().optional(),
    days: z.string().optional(),
  }),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().min(1),
    paymentGateway: z.enum(["razorpay", "stripe", "manual"]).optional(),
    paymentId: z.string().optional(),
    autoRenew: z.boolean().optional(),
  }),
});
