import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as billingService from "@services/billing.service";
import * as paymentService from "@services/Payment.service";
import { convertInrToUsd } from "@services/currency.service";
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
// paid plan back to Free. If the user has an active paid plan running,
// this SCHEDULES the switch for when that plan expires instead of
// applying it instantly; billingService.switchToFreePlan handles that.
// ---------------------------------------------------------------------
/** POST /billing/subscribe-free  { planId } */
export const subscribeFree = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId } = req.body;

  const subscription = await billingService.switchToFreePlan(req.user.id, planId);
  sendSuccess(res, 201, "Free plan request processed", subscription);
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
// Scheduled downgrade cancellation — lets a user back out of a pending
// scheduled plan change before it takes effect.
// ---------------------------------------------------------------------
/** POST /billing/scheduled/cancel */
export const cancelScheduledChange = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await billingService.cancelScheduledChange(req.user.id);
  sendSuccess(res, 200, "Scheduled plan change cancelled", data);
});

// ---------------------------------------------------------------------
// PayPal
// ---------------------------------------------------------------------

/** POST /billing/paypal/create-order  { planId } */
export const createPaypalOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { planId } = req.body;

  const plan = await billingService.getPlanById(planId);
  const referenceId = `QR${crypto.randomBytes(6).toString("hex")}`;

  // PayPal can't receive INR — convert to USD at the current rate.
  // plan.currency/plan.price stay INR everywhere else in the app;
  // this conversion is PayPal-transaction-only.
  let chargeAmount = plan.price;
  let chargeCurrency = plan.currency || "USD";
  let rate: number | null = null;

  if (chargeCurrency === "INR") {
    const conversion = await convertInrToUsd(plan.price);
    chargeAmount = conversion.usdAmount;
    chargeCurrency = "USD";
    rate = conversion.rate;
  }

  const order = await paymentService.createPaypalOrder(chargeAmount, chargeCurrency, referenceId);

  const { subscription } = await billingService.createPendingSubscription(
    req.user.id,
    planId,
    "paypal",
    order.id,
    chargeAmount,
    chargeCurrency
  );

  sendSuccess(res, 201, "PayPal order created", {
    orderId: order.id,
    subscriptionId: subscription._id,
    amount: chargeAmount,
    currency: chargeCurrency,
    originalAmount: plan.price,
    originalCurrency: plan.currency,
    conversionRate: rate,
  });
});

/**
 * GET /billing/paypal/quote/:planId
 * Lets the frontend show the converted USD amount BEFORE the user
 * clicks Pay (create-order locks in a real PayPal order, which you
 * don't want to do just to preview a price).
 */
export const getPaypalQuote = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const plan = await billingService.getPlanById(req.params.planId);

  if (plan.currency === "INR") {
    const { usdAmount, rate } = await convertInrToUsd(plan.price);
    return sendSuccess(res, 200, "Quote fetched", {
      amount: usdAmount,
      currency: "USD",
      originalAmount: plan.price,
      originalCurrency: "INR",
      rate,
    });
  }

  sendSuccess(res, 200, "Quote fetched", {
    amount: plan.price,
    currency: plan.currency,
    originalAmount: plan.price,
    originalCurrency: plan.currency,
    rate: 1,
  });
});
/**
 * POST /billing/paypal/capture  { orderId, subscriptionId }
 * Called by the frontend once the buyer approves the order in the
 * PayPal popup. This is where the money actually moves.
 */
export const capturePaypalOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { orderId, subscriptionId } = req.body;

  const capture = await paymentService.capturePaypalOrder(orderId);

  const captureRecord = capture.purchase_units?.[0]?.payments?.captures?.[0];
  const isCompleted = capture.status === "COMPLETED" && captureRecord?.status === "COMPLETED";

  if (!isCompleted || !captureRecord) {
    await billingService.markSubscriptionCancelled(subscriptionId);
    throw ApiError.badRequest("Payment was not completed.");
  }

  // Activates immediately for upgrades/lateral moves, or schedules for
  // end-of-period if this payment is a downgrade from an active plan.
  const subscription = await billingService.activateOrScheduleSubscription(
    subscriptionId,
    captureRecord.id
  );
  sendSuccess(res, 200, "Payment captured", subscription);
});

/**
 * POST /billing/paypal/webhook
 * PayPal calls this directly (no user session, no auth middleware).
 * Acts as a backstop in case the client-driven capture call above
 * never completes (e.g. tab closed mid-flow) and for later events
 * like refunds/disputes.
 */
export const paypalWebhook = catchAsync(async (req: Request, res: Response) => {
  const isValid = await paymentService.verifyPaypalWebhookSignature(
    req.headers as Record<string, string>,
    req.body
  );

  if (!isValid) {
    return res.status(400).json({ received: false });
  }

  const event = req.body;

  if (
    event.event_type === "CHECKOUT.ORDER.APPROVED" ||
    event.event_type === "PAYMENT.CAPTURE.COMPLETED"
  ) {
    const orderId =
      event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id;

    if (orderId) {
      const subscription = await billingService.findSubscriptionByGatewayOrderId(orderId);
      if (subscription && subscription.status === "pending") {
        await billingService.activateOrScheduleSubscription(
          String(subscription._id),
          event.resource?.id
        );
      }
    }
  }

  res.json({ received: true });
});