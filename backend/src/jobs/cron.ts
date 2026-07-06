import cron from "node-cron";
import { logger } from "@config/logger";
import { QRCode } from "@models/QRCode.model";
import { Subscription, SubscriptionStatus } from "@models/Subscription.model";
import { QRStatus } from "@app-types/enums";

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

/** Marks subscriptions past their endDate as expired. Runs every 6 hours. */
function scheduleSubscriptionExpirySweep() {
  cron.schedule("0 */6 * * *", async () => {
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
  scheduleSubscriptionExpirySweep();
  logger.info("Cron jobs scheduled");
}
