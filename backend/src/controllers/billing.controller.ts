import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as billingService from "@services/billing.service";
import * as paymentService from "@services/Payment.service";
import { env } from "@config/env";
import crypto from "crypto";
export const plans = catchAsync(async (_req: Request, res: Response) => {
  const data = await billingService.listPlans();
  sendSuccess(res, 200, "Plans fetched", data);
});

// ---------------------------------------------------------------------
// Legacy / manual subscribe (kept as-is for backward compatibility)
// ---------------------------------------------------------------------
export const subscribe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId, paymentGateway, paymentId, autoRenew } = req.body;
  const subscription = await billingService.subscribeUserToPlan(req.user.id, planId, {
    paymentGateway,
    paymentId,
    autoRenew,
  });
  sendSuccess(res, 201, "Subscribed successfully", subscription);
});

// ---------------------------------------------------------------------
// Free plan switch (no gateway) — signup default + downgrade from a
// paid plan back to Free. Rejects paid plan ids; see
// billingService.switchToFreePlan for the guard.
// ---------------------------------------------------------------------
/** POST /billing/subscribe-free  { planId } */
export const subscribeFree = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId } = req.body;

  const subscription = await billingService.switchToFreePlan(req.user.id, planId);
  sendSuccess(res, 201, "Switched to free plan", subscription);
});

export const history = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await billingService.getUserBillingHistory(req.user.id);
  sendSuccess(res, 200, "Billing history fetched", data);
});

export const active = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await billingService.getActiveSubscription(req.user.id);
  sendSuccess(res, 200, "Active subscription fetched", data);
});

export const cancel = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await billingService.cancelSubscription(req.user.id, req.params.id);
  sendSuccess(res, 200, "Subscription cancelled", data);
});

// ---------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------

/** POST /billing/razorpay/create-order  { planId } */
export const createRazorpayOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId } = req.body;

  const plan = await billingService.getPlanById(planId);
  const receipt = `QR${crypto.randomBytes(6).toString("hex")}`;
  const order = await paymentService.createRazorpayOrder(plan.price, plan.currency || "INR", receipt);

  const { subscription } = await billingService.createPendingSubscription(
    req.user.id,
    planId,
    "razorpay",
    order.id
  );

  sendSuccess(res, 201, "Razorpay order created", {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID, // safe to expose — this is the public key id
    subscriptionId: subscription._id,
  });
});

/** POST /billing/razorpay/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } */
export const verifyRazorpayPayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = req.body;

  const isValid = paymentService.verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    await billingService.markSubscriptionCancelled(subscriptionId);
    throw ApiError.badRequest("Payment verification failed. Signature mismatch.");
  }

  const subscription = await billingService.activateSubscription(subscriptionId, razorpay_payment_id);
  sendSuccess(res, 200, "Payment verified, subscription activated", subscription);
});

// ---------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------

/** POST /billing/stripe/create-checkout-session  { planId } */
export const createStripeCheckout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId } = req.body;

  const plan = await billingService.getPlanById(planId);
  const { subscription } = await billingService.createPendingSubscription(req.user.id, planId, "stripe");

  const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
  const session = await paymentService.createStripeCheckoutSession({
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency || "INR",
    userId: req.user.id,
    planId: String(plan._id),
    successUrl: `${frontendUrl}/dashboard/billing?stripe=success&subscriptionId=${subscription._id}`,
    cancelUrl: `${frontendUrl}/dashboard/billing?stripe=cancelled`,
  });

  subscription.gatewayOrderId = session.id;
  await subscription.save();

  sendSuccess(res, 201, "Stripe checkout session created", {
    url: session.url,
    sessionId: session.id,
  });
});

/**
 * POST /billing/stripe/webhook
 * IMPORTANT: this route must receive the RAW body, not JSON-parsed —
 * see ENV_SETUP.md for the required app.ts change. No auth middleware
 * runs on this route; Stripe calls it directly from their servers.
 */
export const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  let event;
  try {
    event = paymentService.constructStripeEvent(req.body, signature);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const subscription = await billingService.findSubscriptionByGatewayOrderId(session.id);
    if (subscription) {
      await billingService.activateSubscription(
        String(subscription._id),
        (session.payment_intent as string) || session.id
      );
    }
  }

  res.json({ received: true });
});