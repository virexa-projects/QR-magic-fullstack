import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { createSubscriptionSchema } from "@validators/analytics.validator";
import {
  razorpayOrderSchema,
  razorpayVerifySchema,
  stripeCheckoutSchema,
  subscribeFreeSchema, // add this export alongside the others in Payment.validator.ts
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
router.post("/subscribe-free", validate(subscribeFreeSchema), billingController.subscribeFree);
router.get("/history", billingController.history);
router.get("/active", billingController.active);
router.post("/cancel/:id", billingController.cancel);

// Lets a user back out of a pending scheduled downgrade before it
// takes effect. No body needed — targets whatever is scheduled for
// req.user right now.
router.post("/scheduled/cancel", billingController.cancelScheduledChange);

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