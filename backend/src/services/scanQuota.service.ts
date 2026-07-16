import { User } from "@models/User.model";
import { IPlan } from "@models/Plan.model";

/**
 * Monthly scan counting lives here as a counter on the User document,
 * not as an aggregate over Scantracking.service's raw scan-event
 * collection. Reason: this check runs on EVERY public redirect hit —
 * aggregating over a growing events collection on every single scan
 * would get slower as the product gets more usage, right when it
 * matters most. A counter is O(1) to read and increment.
 *
 * REQUIRES two fields on User.model.ts — add if not already present:
 *
 *   scansThisMonth: { type: Number, default: 0 },
 *   scansMonthResetAt: { type: Date, default: null },
 */

function currentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Rolls the owner's counter over if we've crossed into a new calendar
 * month since it was last reset. No-op once already rolled for the
 * current month — cheap enough to call on every check/increment.
 */
async function rollScanWindowIfNeeded(ownerId: string, monthStart: Date): Promise<void> {
  await User.updateOne(
    {
      _id: ownerId,
      $or: [{ scansMonthResetAt: { $lt: monthStart } }, { scansMonthResetAt: null }],
    },
    { $set: { scansThisMonth: 0, scansMonthResetAt: monthStart } }
  );
}

/**
 * Same "is this plan actually usable right now" resolution as
 * qr.service's plan checks: missing plan, inactive user, or expired
 * plan all collapse to "no active plan" rather than throwing here —
 * this function is a yes/no gate, not a validator.
 */
async function getActivePlanForOwner(ownerId: string): Promise<IPlan | null> {
  const user = await User.findById(ownerId).populate<{ currentPlan: IPlan | null }>("currentPlan");
  if (!user || !user.isActive) return null;
  if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) return null;
  return user.currentPlan ?? null;
}

/**
 * Read-only check — does NOT increment anything. Safe to call
 * speculatively (e.g. to decide whether to bother recording a scan).
 * Same -1-means-unlimited convention as Plan.qrLimit/dynamicQrLimit.
 */
export async function hasScanQuotaRemaining(ownerId: string): Promise<boolean> {
  const plan = await getActivePlanForOwner(ownerId);
  const limit = plan?.scanLimitPerMonth ?? 0;
  if (limit === -1) return true;
  if (limit <= 0) return false;

  const monthStart = currentMonthStart();
  await rollScanWindowIfNeeded(ownerId, monthStart);

  const user = await User.findById(ownerId).select("scansThisMonth").lean();
  const used = user?.scansThisMonth ?? 0;
  return used < limit;
}

/**
 * Increments the owner's monthly scan counter. Only call this after
 * hasScanQuotaRemaining() returned true and you've committed to
 * counting the hit. Fire-and-forget at the call site, same pattern as
 * recordScan/recordClick.
 */
export async function incrementScanUsage(ownerId: string): Promise<void> {
  const monthStart = currentMonthStart();
  await rollScanWindowIfNeeded(ownerId, monthStart);
  await User.updateOne({ _id: ownerId }, { $inc: { scansThisMonth: 1 } });
}