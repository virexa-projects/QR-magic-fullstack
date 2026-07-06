import { addDays } from "date-fns";
import { Plan } from "@models/Plan.model";
import { Subscription, SubscriptionStatus } from "@models/Subscription.model";
import { User } from "@models/User.model";
import { ApiError } from "@utils/ApiError";

export async function listPlans() {
  return Plan.find({ isActive: true }).sort({ price: 1 }).lean();
}

export async function subscribeUserToPlan(
  userId: string,
  planId: string,
  opts: { paymentGateway?: "razorpay" | "stripe" | "manual"; paymentId?: string; autoRenew?: boolean }
) {
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) throw ApiError.notFound("Plan not found or inactive");

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

  // Mark any previous active subscriptions as cancelled (single active plan per user)
  await Subscription.updateMany(
    { user: userId, _id: { $ne: subscription._id }, status: SubscriptionStatus.ACTIVE },
    { status: SubscriptionStatus.CANCELLED }
  );

  await User.findByIdAndUpdate(userId, { currentPlan: plan._id, planExpiresAt: endDate });

  return subscription;
}

export async function getUserBillingHistory(userId: string) {
  return Subscription.find({ user: userId }).populate("plan").sort({ createdAt: -1 }).lean();
}

export async function getActiveSubscription(userId: string) {
  return Subscription.findOne({ user: userId, status: SubscriptionStatus.ACTIVE })
    .populate("plan")
    .sort({ createdAt: -1 })
    .lean();
}

export async function cancelSubscription(userId: string, subscriptionId: string) {
  const sub = await Subscription.findOne({ _id: subscriptionId, user: userId });
  if (!sub) throw ApiError.notFound("Subscription not found");
  sub.status = SubscriptionStatus.CANCELLED;
  sub.autoRenew = false;
  await sub.save();
  return sub;
}
