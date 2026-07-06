import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { ApiError } from "@utils/ApiError";
import { recordScanAndResolve } from "@services/scan.service";
import { getClientIp, parseDevice, geoLookup } from "@utils/deviceParser";

/**
 * GET /r/:shortCode
 * Public, unauthenticated, high-traffic endpoint. Resolves a dynamic QR's
 * short code to its destination, logs analytics, then redirects the visitor.
 */
export const resolveShortCode = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  if (!shortCode) throw ApiError.badRequest("Short code required");

  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "";
  const { device, os, browser } = parseDevice(userAgent);
  const geo = geoLookup(ip);

  const { destination, type } = await recordScanAndResolve({
    shortCode,
    ip,
    userAgent,
    device,
    os,
    browser,
    referrer: req.headers.referer,
    ...geo,
  });

  const target = buildRedirectTarget(type, destination);
  res.redirect(302, target);
});

function buildRedirectTarget(type: string, destination: string): string {
  switch (type) {
    case "whatsapp":
      return `https://wa.me/${destination.replace(/\D/g, "")}`;
    case "phone":
      return `tel:${destination}`;
    case "sms":
      return `sms:${destination}`;
    case "email":
      return `mailto:${destination}`;
    case "url":
      return destination;
    default:
      return destination.startsWith("http") ? destination : `https://${destination}`;
  }
}
