import { z } from "zod";
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-MM-dd format");


export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().min(1),
    paymentGateway: z.enum(["razorpay", "stripe", "manual"]).optional(),
    paymentId: z.string().optional(),
    autoRenew: z.boolean().optional(),
  }),
});

export const analyticsRangeSchema = z
  .object({
    query: z
      .object({
        startDate: isoDate.optional(),
        endDate: isoDate.optional(),
      })
      .refine(
        (q) => !q.startDate || !q.endDate || q.startDate <= q.endDate,
        { message: "endDate must be on or after startDate", path: ["endDate"] }
      ),
  })
  .passthrough();
 