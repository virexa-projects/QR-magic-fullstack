import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as qrService from "@services/qr.service";
import { recordClick, recordScan } from "@services/Scantracking.service";
import { hasScanQuotaRemaining, incrementScanUsage } from "@services/scanQuota.service";
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
export const redirectByShortCode = catchAsync(
  async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    const fallbackUrl = `${env.FRONTEND_URL}/${shortCode}`;

    console.log("====================================");
    console.log("QR Redirect Request");
    console.log("Short Code:", shortCode);

    const qr = await qrService.getQrByShortCode(shortCode).catch(() => null);

    if (!qr) {
      console.log("QR not found");
      return res.redirect(302, fallbackUrl);
    }

    console.log("QR Type:", qr.type);

    // Check expired
    const isExpired = qr.expiresAt
      ? new Date(qr.expiresAt) < new Date()
      : false;

    if (isExpired) {
      console.log("QR Expired");
      return res.redirect(302, fallbackUrl);
    }

    // Monthly scan quota
    const withinQuota = await hasScanQuotaRemaining(
      qr.owner.toString()
    );

    if (!withinQuota) {
      console.log("Monthly scan limit exceeded");
      return res.redirect(302, fallbackUrl);
    }

    // Record scan
    recordScan(qr._id, qr.owner, req).catch(console.error);
    incrementScanUsage(qr.owner.toString()).catch(console.error);

    /**
     * Preview QR Types
     */
    const previewTypes: QRType[] = [
      QRType.VCARD,
      QRType.IMAGE,
      QRType.VIDEO,
      QRType.AUDIO,
      QRType.SOCIAL,
      QRType.EVENT,
      QRType.FEEDBACK,
      QRType.MENU,
      QRType.PLAYLIST,
      QRType.TEXT
    ];

    if (previewTypes.includes(qr.type)) {
      const previewUrl = `${env.FRONTEND_URL}/preview/${shortCode}`;

      console.log("Preview Redirect:", previewUrl);

      return res.redirect(302, previewUrl);
    }

    /**
     * TEXT QR
     */
    if (qr.type === QRType.TEXT) {
      const text = qr.content?.text || qr.destination || "";

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );

      return res.send(text);
    }

    /**
     * All remaining QR types
     */
    const destinationHref = qrService.buildDestinationHref(qr);

    console.log("Destination Redirect:", destinationHref);

    return res.redirect(302, destinationHref);
  }
);

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