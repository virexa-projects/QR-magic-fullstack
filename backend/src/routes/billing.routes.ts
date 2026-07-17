import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { createSubscriptionSchema } from "@validators/analytics.validator";
import {
  paypalOrderSchema,
  paypalCaptureSchema,
  subscribeFreeSchema,
} from "@validators/Payment.validator";
import * as billingController from "@controllers/billing.controller";

const router = Router();

router.get("/plans", billingController.plans);

// PayPal calls this directly (no user session). Needs the raw body if
// you turn on webhook-signature verification against the raw payload —
// see ENV_SETUP.md for the express.json({ verify }) note.
router.post("/paypal/webhook", billingController.paypalWebhook);

router.use(authenticate);
router.get("/paypal/quote/:planId", billingController.getPaypalQuote);
router.post("/paypal/create-order", validate(paypalOrderSchema), billingController.createPaypalOrder);
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
  "/paypal/create-order",
  validate(paypalOrderSchema),
  billingController.createPaypalOrder
);
router.post(
  "/paypal/capture",
  validate(paypalCaptureSchema),
  billingController.capturePaypalOrder
);

export default router;