import { addDays } from "date-fns";
import { QRCode, QRStatus } from "@models/QRCode.model";
import { Plan } from "@models/Plan.model";
import { Subscription, SubscriptionStatus } from "@models/Subscription.model";
import { User } from "@models/User.model";
import { ApiError } from "@utils/ApiError";

type PaymentGateway = "free" | "razorpay" | "stripe" | "manual";

// --- Plan tier ranking (server-side mirror of the frontend ladder) -------
// Used to decide whether a plan change is an upgrade, lateral, or
// downgrade. Downgrades get scheduled for end-of-period instead of
// applying instantly; everything else applies immediately.
const PLAN_TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

function tierRankOfSlug(slug?: string | null): number {
  if (!slug) return 0;
  const key = slug.toLowerCase();
  return key in PLAN_TIER_ORDER ? PLAN_TIER_ORDER[key] : 0;
}

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
 * Finds the user's currently ACTIVE, non-expired subscription, if any.
 * Guards against a stale ACTIVE row whose endDate has already passed
 * but the cron hasn't processed yet.
 */
async function getLiveActiveSubscription(userId: string) {
  const sub = await Subscription.findOne({ user: userId, status: SubscriptionStatus.ACTIVE });
  if (!sub) return null;
  if (sub.endDate <= new Date()) return null;
  return sub;
}

/**
 * Core decision point for both the free-switch path and the paid
 * gateway path: is this a downgrade relative to what's live right now?
 * Paid -> lower paid tier, or paid -> Free, both count. Everything else
 * (no active plan, or targeting an equal/higher tier) is immediate.
 */
async function isDowngradeForUser(userId: string, targetPlan: { slug: string }) {
  const activeSub = await getLiveActiveSubscription(userId);
  if (!activeSub) return { isDowngrade: false as const, activeSub: null };

  const activePlan = await Plan.findById(activeSub.plan).lean();
  const activeRank = tierRankOfSlug(activePlan?.slug);
  const targetRank = tierRankOfSlug(targetPlan.slug);

  return { isDowngrade: targetRank < activeRank, activeSub };
}

/**
 * Creates a SCHEDULED subscription row that will take over once the
 * user's current active plan expires. Only one scheduled change is
 * kept at a time — picking a new target replaces any prior schedule.
 */
async function createScheduledSubscription(
  userId: string,
  plan: { _id: any; price: number; currency: string; durationDays: number },
  activeSub: { endDate: Date },
  gateway: PaymentGateway,
  paymentId?: string,
  gatewayOrderId?: string
) {
  await Subscription.deleteMany({ user: userId, status: SubscriptionStatus.SCHEDULED });

  const startDate = activeSub.endDate;
  const endDate = addDays(startDate, plan.durationDays);

  return Subscription.create({
    user: userId,
    plan: plan._id,
    status: SubscriptionStatus.SCHEDULED,
    startDate,
    endDate,
    amount: plan.price,
    currency: plan.currency,
    paymentGateway: gateway,
    paymentId,
    gatewayOrderId,
    autoRenew: false,
  });
}

/**
 * Switches a user onto a free (price === 0) plan with no gateway
 * involved. Used both for the initial signup default plan and for
 * users downgrading off a paid plan back to Free.
 *
 * - No active paid plan (or it's expired) -> switches to Free immediately.
 * - Active paid plan still running -> SCHEDULES Free to start when the
 *   current plan's endDate arrives, instead of applying instantly.
 *
 * Deliberately still rejects any plan with price > 0 — this is the only
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

  const { isDowngrade, activeSub } = await isDowngradeForUser(userId, { slug: plan.slug });

  if (isDowngrade && activeSub) {
    return createScheduledSubscription(userId, plan, activeSub, "free");
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
 * Real-gateway flow, step 2 (original behavior — always activates
 * immediately). Still used directly for upgrades / lateral moves via
 * activateOrScheduleSubscription below, and kept exported standalone
 * in case anything else in the codebase calls it directly.
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

/**
 * Real-gateway flow, step 2 (new entry point — call this instead of
 * activateSubscription from verify/webhook). Decides whether the
 * payment that just succeeded should activate immediately or get
 * scheduled for when the user's current plan expires.
 */
export async function activateOrScheduleSubscription(subscriptionId: string, paymentId: string) {
  const pendingSub = await Subscription.findById(subscriptionId);
  if (!pendingSub) throw ApiError.notFound("Subscription not found");

  const targetPlan = await Plan.findById(pendingSub.plan).lean();
  if (!targetPlan) throw ApiError.notFound("Plan not found");

  const { isDowngrade, activeSub } = await isDowngradeForUser(String(pendingSub.user), {
    slug: targetPlan.slug,
  });

  // Not a downgrade (upgrade, lateral, or no live active plan) -> old behavior.
  if (!isDowngrade || !activeSub) {
    return activateSubscription(subscriptionId, paymentId);
  }

  // Downgrade: convert the PENDING row itself into the SCHEDULED row
  // (already paid), and leave the active plan running untouched.
  const startDate = activeSub.endDate;
  const endDate = addDays(startDate, targetPlan.durationDays);

  pendingSub.status = SubscriptionStatus.SCHEDULED;
  pendingSub.paymentId = paymentId;
  pendingSub.startDate = startDate;
  pendingSub.endDate = endDate;
  await pendingSub.save();

  return pendingSub;
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

  // Surface any pending scheduled downgrade so the UI can show it
  // (e.g. "Switching to Starter on 31 Jul").
  const scheduled = await Subscription.findOne({
    user: userId,
    status: SubscriptionStatus.SCHEDULED,
  })
    .populate("plan")
    .lean();

  return {
    ...subscription,
    plan,
    usage: {
      dynamicQrUsed,
      dynamicQrLimit: plan.dynamicQrLimit,
      qrLimit: plan.qrLimit,
      scanLimitPerMonth: plan.scanLimitPerMonth,
    },
    scheduledChange: scheduled
      ? {
          planName: (scheduled.plan as any).name,
          effectiveDate: scheduled.startDate,
        }
      : null,
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

/**
 * Lets a user back out of a pending scheduled downgrade before it
 * takes effect. Their current active plan is unaffected either way.
 */
export async function cancelScheduledChange(userId: string) {
  const scheduled = await Subscription.findOne({
    user: userId,
    status: SubscriptionStatus.SCHEDULED,
  });
  if (!scheduled) throw ApiError.notFound("No scheduled plan change found");

  scheduled.status = SubscriptionStatus.CANCELLED;
  await scheduled.save();
  return scheduled;
}

/**
 * Cron entry point — wire this into whatever scheduler you use
 * (node-cron, agenda, a queue worker, etc.), run at least daily.
 * Flips due SCHEDULED rows to ACTIVE and cancels the plan they replace.
 */
export async function processScheduledSubscriptions() {
  const due = await Subscription.find({
    status: SubscriptionStatus.SCHEDULED,
    startDate: { $lte: new Date() },
  });

  for (const scheduled of due) {
    // Cancel whatever is (or was) active for this user right now.
    await Subscription.updateMany(
      { user: scheduled.user, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED }
    );

    scheduled.status = SubscriptionStatus.ACTIVE;
    await scheduled.save();

    await User.findByIdAndUpdate(scheduled.user, {
      currentPlan: scheduled.plan,
      planExpiresAt: scheduled.endDate,
    });
  }

  return due.length;
}