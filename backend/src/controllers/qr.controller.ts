import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as qrService from "@services/qr.service";
import { UserRole } from "@app-types/enums";
import { env } from "@config/env";

export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await qrService.createQr(req.user.id, req.body);
  sendSuccess(res, 201, "QR code created", result);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100);

  const result = await qrService.listQrs(req.user.id, {
    page,
    limit,
    status: req.query.status as any,
    type: req.query.type as any,
    search: req.query.search as string | undefined,
  });

  sendSuccess(res, 200, "QR codes fetched", result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const isPrivileged = [UserRole.ADMIN, UserRole.SUPERADMIN].includes(req.user.role);
  const qr = await qrService.getQrById(req.user.id, req.params.id, isPrivileged);
  sendSuccess(res, 200, "QR code fetched", {
    qr,
    shortUrl: `${env.SHORT_URL_BASE}/${qr.shortCode}`,
  });
});
export const getByShortCode = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  const qr = await qrService.getQrByShortCode(shortCode);

  sendSuccess(res, 200, "QR code fetched", {
    qr,
    shortUrl: `${env.SHORT_URL_BASE}/${qr.shortCode}`,
  });
});
export const update = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const isPrivileged = [UserRole.ADMIN, UserRole.SUPERADMIN].includes(req.user.role);
  const qr = await qrService.updateQr(req.user.id, req.params.id, req.body, isPrivileged);
  sendSuccess(res, 200, "QR code updated", qr);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const isPrivileged = [UserRole.ADMIN, UserRole.SUPERADMIN].includes(req.user.role);
  await qrService.deleteQr(req.user.id, req.params.id, isPrivileged);
  sendSuccess(res, 200, "QR code deleted");
});
