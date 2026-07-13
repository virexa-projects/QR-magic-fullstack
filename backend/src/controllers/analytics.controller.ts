import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as analyticsService from "@services/analytics.service";

type RangeQuery = { startDate?: string; endDate?: string };

export const summary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getDashboardSummary(req.user.id, startDate, endDate);
  sendSuccess(res, 200, "Summary fetched", data);
});

export const trend = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getScansTrend(req.user.id, startDate, endDate);
  sendSuccess(res, 200, "Scans trend fetched", data);
});

export const devices = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getDeviceBreakdown(req.user.id, startDate, endDate);
  sendSuccess(res, 200, "Device breakdown fetched", data);
});

export const locations = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getLocationBreakdown(req.user.id, limit, startDate, endDate);
  sendSuccess(res, 200, "Location breakdown fetched", data);
});

export const hourly = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getHourlyHeatmap(req.user.id, startDate, endDate);
  sendSuccess(res, 200, "Hourly heatmap fetched", data);
});

export const qrAnalytics = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { startDate, endDate } = req.query as RangeQuery;
  const data = await analyticsService.getQrAnalytics(req.user.id, req.params.id, startDate, endDate);
  sendSuccess(res, 200, "QR analytics fetched", data);
});

export const qrScansToday = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await analyticsService.getQrScansToday(req.user.id, req.params.id);
  sendSuccess(res, 200, "QR scans today fetched", data);
});

export const qrLocations = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const limit = parseInt((req.query.limit as string) || "6", 10);
  const data = await analyticsService.getQrLocationBreakdown(req.user.id, req.params.id, limit);
  sendSuccess(res, 200, "QR location breakdown fetched", data);
});

export const qrRecentScans = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const limit = parseInt((req.query.limit as string) || "8", 10);
  const data = await analyticsService.getRecentScans(req.user.id, req.params.id, limit);
  sendSuccess(res, 200, "Recent scans fetched", data);
});