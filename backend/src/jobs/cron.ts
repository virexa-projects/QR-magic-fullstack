import cron from "node-cron";
import { logger } from "@config/logger";
import { QRCode } from "@models/QRCode.model";
import { Subscription, SubscriptionStatus } from "@models/Subscription.model";
import { QRStatus } from "@app-types/enums";
import { processScheduledSubscriptions } from "@services/billing.service";

/** Resets the rolling "scansToday" counter on every QR code, once per day at midnight UTC. */
function scheduleDailyCounterReset() {
  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await QRCode.updateMany({}, { $set: { scansToday: 0 } });
      logger.info(`Daily scan counter reset: ${result.modifiedCount} QR codes`);
    } catch (err) {
      logger.error(`Daily counter reset failed: ${err}`);
    }
  });
}

/** Marks QR codes past their expiresAt date as expired. Runs hourly. */
function scheduleQrExpirySweep() {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await QRCode.updateMany(
        { expiresAt: { $ne: null, $lte: new Date() }, status: { $ne: QRStatus.EXPIRED } },
        { $set: { status: QRStatus.EXPIRED } }
      );
      if (result.modifiedCount) logger.info(`QR expiry sweep: ${result.modifiedCount} QR codes expired`);
    } catch (err) {
      logger.error(`QR expiry sweep failed: ${err}`);
    }
  });
}

/**
 * Subscription lifecycle sweep — runs every 6 hours. Two steps, run in
 * this exact order to avoid a race between them:
 *
 *   1. Activate due SCHEDULED downgrades (SCHEDULED -> ACTIVE, and
 *      cancels whatever plan they're replacing).
 *   2. THEN expire any subscription still ACTIVE past its endDate that
 *      had nothing scheduled to take over.
 *
 * Doing (1) before (2) in the same tick means a plan with a downgrade
 * queued up always gets swapped over cleanly, instead of occasionally
 * being marked EXPIRED for the few hours before the next sweep would
 * have activated its replacement anyway.
 */
function scheduleSubscriptionLifecycleSweep() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const activatedCount = await processScheduledSubscriptions();
      if (activatedCount > 0) {
        logger.info(`Scheduled downgrade activation: ${activatedCount} subscription(s) activated`);
      }
    } catch (err) {
      logger.error(`Scheduled downgrade activation failed: ${err}`);
    }

    try {
      const result = await Subscription.updateMany(
        { endDate: { $lte: new Date() }, status: SubscriptionStatus.ACTIVE },
        { $set: { status: SubscriptionStatus.EXPIRED } }
      );
      if (result.modifiedCount) {
        logger.info(`Subscription expiry sweep: ${result.modifiedCount} subscriptions expired`);
      }
    } catch (err) {
      logger.error(`Subscription expiry sweep failed: ${err}`);
    }
  });
}

export function startCronJobs(): void {
  scheduleDailyCounterReset();
  scheduleQrExpirySweep();
  scheduleSubscriptionLifecycleSweep();
  logger.info("Cron jobs scheduled");
}