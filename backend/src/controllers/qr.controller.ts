import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as qrService from "@services/qr.service";
import { recordClick, recordScan } from "@services/Scantracking.service";
import { UserRole, QRType } from "@app-types/enums";
import { env } from "@config/env";
import { buildVCardString } from "@utils/vcard.util";

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
    shortUrl: qr.shortUrl,
  });
});

/**
 * Legacy JSON endpoint — kept for any existing frontend calls (e.g. an
 * admin preview screen), but the physical QR image no longer points
 * here. Still logs a scan for backward compatibility if anything still
 * calls it directly.
 */
export const getByShortCode = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  const qr = await qrService.getQrByShortCode(shortCode);

  recordScan(qr._id, qr.owner, req).catch(() => {});

  sendSuccess(res, 200, "QR code fetched", {
    qr,
    shortUrl: qr.shortUrl,
  });
});

/**
 * Legacy click-tracking endpoint — no longer called by the new
 * auto-redirect flow (there's no button tap anymore, so there's no
 * separate click event), kept only in case anything still references it.
 */
export const trackClick = catchAsync(async (req: Request, res: Response) => {
  const qr = await qrService.getQrByShortCode(req.params.shortCode).catch(() => null);
  if (qr) {
    recordClick(qr._id, qr.owner, req).catch(() => {});
  }
  sendSuccess(res, 200, "Click recorded", {});
});

/**
 * Public, no auth. This is the actual target encoded in the printed QR
 * image (see shortUrl in qr.service.ts createQr). Every type redirects
 * immediately except vcard, which streams a .vcf download instead —
 * there's no URL a "save this contact" action can redirect to.
 *
 * Only a scan is recorded here. There's no separate click event in this
 * flow since the visitor never lands on an interstitial page to tap
 * anything — the redirect happens the instant the QR is scanned.
 */
export const redirectByShortCode = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const previewFallbackUrl = `${env.FRONTEND_URL}/${shortCode}`;

  // Swallow lookup failure — a missing/paused code shouldn't throw a raw
  // JSON error at a scanning phone, it should fall back to a page that
  // can actually explain what happened.
  const qr = await qrService.getQrByShortCode(shortCode).catch(() => null);

  if (!qr) {
    return res.redirect(302, previewFallbackUrl);
  }

  const isExpired = qr.expiresAt ? new Date(qr.expiresAt) < new Date() : false;
  if (isExpired) {
    return res.redirect(302, previewFallbackUrl);
  }

  // Fire-and-forget — the scan counts even if this write is still in
  // flight when the redirect/response is sent.
  recordScan(qr._id, qr.owner, req).catch(() => {});

  if (qr.type === QRType.VCARD) {
    const vcf = buildVCardString(qr.content || {});
    const filename = `${(qr.content?.fullName || "contact").trim().replace(/\s+/g, "_")}.vcf`;
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(vcf);
  }

  if (qr.type === QRType.TEXT) {
    // No URL to redirect to — plain text content is served directly.
    const text = qr.content?.text || qr.destination || "";
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(text);
  }

  const destinationHref = qrService.buildDestinationHref(qr);
  return res.redirect(302, destinationHref);
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