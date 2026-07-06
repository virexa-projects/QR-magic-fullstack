import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as billingService from "@services/billing.service";

export const plans = catchAsync(async (_req: Request, res: Response) => {
  const data = await billingService.listPlans();
  sendSuccess(res, 200, "Plans fetched", data);
});

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
