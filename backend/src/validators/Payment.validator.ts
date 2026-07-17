import { z } from "zod";

export const subscribeFreeSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "planId is required"),
  }),
});

export const paypalOrderSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "planId is required"),
  }),
});

export const paypalCaptureSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, "orderId is required"),
    subscriptionId: z.string().min(1, "subscriptionId is required"),
  }),
});