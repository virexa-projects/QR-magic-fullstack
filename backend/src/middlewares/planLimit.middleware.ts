import { Request, Response, NextFunction } from "express";
import { catchAsync } from "@utils/catchAsync";
import { ApiError } from "@utils/ApiError";
import { QRCode } from "@models/QRCode.model";
import { User } from "@models/User.model";
import { Plan } from "@models/Plan.model";

/**
 * Enforces the user's plan quota (max QR codes / max dynamic QR codes)
 * before allowing creation of a new QR code.
 */
export const enforceQrQuota = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw ApiError.unauthorized();

  const user = await User.findById(req.user.id).select("currentPlan planExpiresAt").lean();
  const plan = user?.currentPlan
    ? await Plan.findById(user.currentPlan).lean()
    : await Plan.findOne({ slug: "free" }).lean();

  if (!plan) return next(); // no plan config found - fail open in dev, configure plans in prod

  const planActive = !user?.planExpiresAt || user.planExpiresAt > new Date();
  const effectivePlan = planActive ? plan : await Plan.findOne({ slug: "free" }).lean();
  if (!effectivePlan) return next();

  const totalQrs = await QRCode.countDocuments({ owner: req.user.id });
  if (effectivePlan.qrLimit !== -1 && totalQrs >= effectivePlan.qrLimit) {
    throw ApiError.forbidden(
      `QR code limit (${effectivePlan.qrLimit}) reached for your plan. Please upgrade.`
    );
  }

  if (req.body?.isDynamic) {
    const dynamicQrs = await QRCode.countDocuments({ owner: req.user.id, isDynamic: true });
    if (effectivePlan.dynamicQrLimit !== -1 && dynamicQrs >= effectivePlan.dynamicQrLimit) {
      throw ApiError.forbidden(
        `Dynamic QR code limit (${effectivePlan.dynamicQrLimit}) reached for your plan. Please upgrade.`
      );
    }
  }

  next();
});
