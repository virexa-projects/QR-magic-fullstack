import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as analyticsService from "@services/analytics.service";

export const summary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await analyticsService.getDashboardSummary(req.user.id);
  sendSuccess(res, 200, "Summary fetched", data);
});

export const trend = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const days = parseInt((req.query.days as string) || "30", 10);
  const data = await analyticsService.getScansTrend(req.user.id, days);
  sendSuccess(res, 200, "Scans trend fetched", data);
});

export const devices = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const days = parseInt((req.query.days as string) || "30", 10);
  const data = await analyticsService.getDeviceBreakdown(req.user.id, days);
  sendSuccess(res, 200, "Device breakdown fetched", data);
});

export const locations = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await analyticsService.getLocationBreakdown(req.user.id);
  sendSuccess(res, 200, "Location breakdown fetched", data);
});

export const hourly = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const days = parseInt((req.query.days as string) || "7", 10);
  const data = await analyticsService.getHourlyHeatmap(req.user.id, days);
  sendSuccess(res, 200, "Hourly heatmap fetched", data);
});

export const qrAnalytics = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const days = parseInt((req.query.days as string) || "30", 10);
  const data = await analyticsService.getQrAnalytics(req.user.id, req.params.id, days);
  sendSuccess(res, 200, "QR analytics fetched", data);
});
