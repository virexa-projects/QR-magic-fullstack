import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { createSubscriptionSchema } from "@validators/analytics.validator";
import {
  razorpayOrderSchema,
  razorpayVerifySchema,
  stripeCheckoutSchema,
} from "@validators/Payment.validator";
import * as billingController from "@controllers/billing.controller";

const router = Router();

router.get("/plans", billingController.plans);

// Stripe calls this directly (no user session, no JSON-parsed body).
// See ENV_SETUP.md — app.ts must mount express.raw() for this exact
// path BEFORE the global express.json() middleware.
router.post("/stripe/webhook", billingController.stripeWebhook);

router.use(authenticate);

router.post("/subscribe", validate(createSubscriptionSchema), billingController.subscribe);
router.get("/history", billingController.history);
router.get("/active", billingController.active);
router.post("/cancel/:id", billingController.cancel);

router.post(
  "/razorpay/create-order",
  validate(razorpayOrderSchema),
  billingController.createRazorpayOrder
);
router.post(
  "/razorpay/verify",
  validate(razorpayVerifySchema),
  billingController.verifyRazorpayPayment
);
router.post(
  "/stripe/create-checkout-session",
  validate(stripeCheckoutSchema),
  billingController.createStripeCheckout
);

export default router;