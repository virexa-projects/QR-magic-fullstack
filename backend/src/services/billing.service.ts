import { addDays } from "date-fns";
import { QRCode, QRStatus } from "@models/QRCode.model";
import { Plan } from "@models/Plan.model";
import { Subscription, SubscriptionStatus } from "@models/Subscription.model";
import { User } from "@models/User.model";
import { ApiError } from "@utils/ApiError";
type PaymentGateway = "free" | "razorpay" | "stripe" | "manual";
export async function listPlans() {
  return Plan.find({ isActive: true }).sort({ price: 1 }).lean();
}

export async function getPlanById(planId: string) {
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) throw ApiError.notFound("Plan not found or inactive");
  return plan;
}

/**
 * Legacy / manual flow — kept for backward compatibility (e.g. an admin
 * granting a plan by hand). Marks the subscription ACTIVE immediately.
 */
export async function subscribeUserToPlan(
  userId: string,
  planId: string,
  opts: { paymentGateway?: PaymentGateway; paymentId?: string; autoRenew?: boolean }
) {
  const plan = await getPlanById(planId);

  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  const subscription = await Subscription.create({
    user: userId,
    plan: plan._id,
    status: SubscriptionStatus.ACTIVE,
    startDate,
    endDate,
    amount: plan.price,
    currency: plan.currency,
    paymentGateway: opts.paymentGateway ?? "manual",
    paymentId: opts.paymentId,
    autoRenew: opts.autoRenew ?? false,
  });

  await Subscription.updateMany(
    { user: userId, _id: { $ne: subscription._id }, status: SubscriptionStatus.ACTIVE },
    { status: SubscriptionStatus.CANCELLED }
  );

  await User.findByIdAndUpdate(userId, { currentPlan: plan._id, planExpiresAt: endDate });

  return subscription;
}

/**
 * Switches a user onto a free (price === 0) plan with no gateway
 * involved. Used both for the initial signup default plan and for
 * users downgrading off a paid plan back to Free.
 *
 * Deliberately rejects any plan with price > 0 — this is the only
 * thing stopping someone from hitting this route with a paid plan's
 * id to get it for free, so don't relax it without adding an
 * equivalent check somewhere else.
 */
export async function switchToFreePlan(userId: string, planId: string) {
  const plan = await getPlanById(planId);

  if (plan.price !== 0) {
    throw ApiError.badRequest(
      "This plan requires payment. Use the Razorpay/Stripe checkout instead."
    );
  }

  return subscribeUserToPlan(userId, planId, { paymentGateway: "free" });
}

/**
 * Real-gateway flow, step 1: create a PENDING subscription row before
 * the user has actually paid. `gatewayOrderId` is the Razorpay order id
 * (known up front) or left undefined for Stripe (set right after the
 * checkout session is created, since the session id is the lookup key).
 */
export async function createPendingSubscription(
  userId: string,
  planId: string,
  gateway: "razorpay" | "stripe",
  gatewayOrderId?: string
) {
  const plan = await getPlanById(planId);

  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  const subscription = await Subscription.create({
    user: userId,
    plan: plan._id,
    status: SubscriptionStatus.PENDING,
    startDate,
    endDate,
    amount: plan.price,
    currency: plan.currency,
    paymentGateway: gateway,
    gatewayOrderId,
    autoRenew: false,
  });

  return { subscription, plan };
}

/**
 * Real-gateway flow, step 2: called once payment is confirmed (Razorpay
 * signature verified, or Stripe webhook received). Activates the
 * subscription and demotes any other active subscription for the user.
 */
export async function activateSubscription(subscriptionId: string, paymentId: string) {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) throw ApiError.notFound("Subscription not found");

  sub.status = SubscriptionStatus.ACTIVE;
  sub.paymentId = paymentId;
  sub.startDate = new Date();
  await sub.save();

  await Subscription.updateMany(
    { user: sub.user, _id: { $ne: sub._id }, status: SubscriptionStatus.ACTIVE },
    { status: SubscriptionStatus.CANCELLED }
  );

  await User.findByIdAndUpdate(sub.user, {
    currentPlan: sub.plan,
    planExpiresAt: sub.endDate,
  });

  return sub;
}

export async function markSubscriptionCancelled(subscriptionId: string) {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) return null;
  sub.status = SubscriptionStatus.CANCELLED;
  await sub.save();
  return sub;
}

export async function findSubscriptionByGatewayOrderId(gatewayOrderId: string) {
  return Subscription.findOne({ gatewayOrderId });
}

export async function getUserBillingHistory(userId: string) {
  return Subscription.find({ user: userId }).populate("plan").sort({ createdAt: -1 }).lean();
}

export async function getActiveSubscription(userId: string) {
  // Get active subscription
  const subscription = await Subscription.findOne({
    user: userId,
    status: SubscriptionStatus.ACTIVE,
  }).lean();

  if (!subscription) return null;

  // Get subscribed plan
  const plan = await Plan.findById(subscription.plan).lean();

  if (!plan) return null;

  // Count active dynamic QR codes
  const dynamicQrUsed = await QRCode.countDocuments({
    owner: userId,
    isDynamic: true,
    status: QRStatus.ACTIVE,
  });

  return {
    ...subscription,
    plan,
    usage: {
      dynamicQrUsed,
      dynamicQrLimit: plan.dynamicQrLimit,
      qrLimit: plan.qrLimit,
      scanLimitPerMonth: plan.scanLimitPerMonth,
    },
  };
}

export async function cancelSubscription(userId: string, subscriptionId: string) {
  const sub = await Subscription.findOne({ _id: subscriptionId, user: userId });
  if (!sub) throw ApiError.notFound("Subscription not found");
  sub.status = SubscriptionStatus.CANCELLED;
  sub.autoRenew = false;
  await sub.save();
  return sub;
}