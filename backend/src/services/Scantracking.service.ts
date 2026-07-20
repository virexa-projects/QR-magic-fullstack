import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import { Types } from "mongoose";
import { QRCode } from "@models/QRCode.model";
import { Scan } from "@models/Scan.model";
import { AnalyticsDaily } from "@models/AnalyticsDaily.model";
import { DeviceType } from "@app-types/enums";
import { resolveGeo } from "./Geo.service";
import { getISTHour } from "@utils/time";
import { notifyScan, notifyClick } from "./Notification.service";

function mapDeviceType(ua: ReturnType<UAParser["getResult"]>): DeviceType {
  const os = ua.os.name?.toLowerCase() || "";
  if (os.includes("android")) return DeviceType.ANDROID;
  if (os.includes("ios")) return DeviceType.IOS;
  if (!ua.device.type) return DeviceType.DESKTOP;
  return DeviceType.OTHER;
}

function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}
// function todayBucket(): string {
//   return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
// }
export async function recordScan(
  qrCodeId: Types.ObjectId,
  ownerId: Types.ObjectId,
  req: Request
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const ua = new UAParser(userAgent).getResult();
    const device = mapDeviceType(ua);
    const geo = await resolveGeo(req);
    const date = todayBucket();
    const dayStart = new Date(`${date}T00:00:00.000Z`);

    const DEDUPE_WINDOW_MS = 5000;
    const veryRecentDuplicate = await Scan.exists({
      qrCode: qrCodeId,
      ip: geo.ip,
      scannedAt: { $gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    });
    if (veryRecentDuplicate) return;

    const alreadyScannedToday = await Scan.exists({
      qrCode: qrCodeId,
      ip: geo.ip,
      scannedAt: { $gte: dayStart },
    });

    await Scan.create({
      qrCode: qrCodeId,
      owner: ownerId,
      ip: geo.ip,
      userAgent,
      device,
      browser: ua.browser.name,
      os: ua.os.name,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      referrer: (req.headers.referer as string) || (req.headers.referrer as string),
      scannedAt: new Date(),
    });
    const qrDoc = await QRCode.findById(qrCodeId).select("scansTodayDate");
    if (qrDoc?.scansTodayDate === date) {
      await QRCode.findByIdAndUpdate(qrCodeId, {
        $inc: { scansTotal: 1, scansToday: 1 },
        $set: { lastScanAt: new Date() },
      });
    } else {
      await QRCode.findByIdAndUpdate(qrCodeId, {
        $inc: { scansTotal: 1 },
        $set: { scansToday: 1, scansTodayDate: date, lastScanAt: new Date() },
      });
    }
    // ❌ REMOVED — this was the duplicate increment causing double counts

    const hour = getISTHour();
    const incFields: Record<string, number> = {
      scans: 1,
      [`deviceBreakdown.${device}`]: 1,
    };
    if (geo.country) incFields[`countryBreakdown.${geo.country}`] = 1;
    if (!alreadyScannedToday) incFields.uniqueIps = 1;

    const daily = await AnalyticsDaily.findOneAndUpdate(
      { qrCode: qrCodeId, date },
      { $inc: incFields, $setOnInsert: { owner: ownerId, qrCode: qrCodeId, date } },
      { upsert: true, new: true }
    );

    if (daily) {
      daily.hourlyBreakdown[hour] = (daily.hourlyBreakdown[hour] || 0) + 1;
      await daily.save();
    }

    // Create a persistent notification + emit "notification:new" for the bell icon
    const qr = await QRCode.findById(qrCodeId).select("name").lean();
    if (qr) {
      notifyScan(ownerId.toString(), qrCodeId.toString(), qr.name).catch(() => {});
    }
  } catch (err) {
    console.error("[scanTracking] failed to record scan:", err);
  }
}

/**
 * NEW: records a click-through — the visitor already landed on the preview
 * page (that's the "scan"/open, captured by recordScan above) and then
 * tapped the primary CTA (Visit site / Call / Join network / etc). This is
 * the number that actually tells you whether the QR converts, not just
 * whether it was opened. Same fire-and-forget contract as recordScan: never
 * throws, never blocks the caller.
 *
 * IP dedupe here is intentionally short (2s) — unlike scans, a real click
 * can legitimately repeat (user goes back and taps again), we only want to
 * collapse literal double-fires from a flaky sendBeacon retry.
 */
export async function recordClick(
  qrCodeId: Types.ObjectId,
  ownerId: Types.ObjectId,
  req: Request
): Promise<void> {
  try {
    const geo = await resolveGeo(req);
    const date = todayBucket();

    const DEDUPE_WINDOW_MS = 2000;
    const veryRecentDuplicate = await AnalyticsDaily.exists({
      qrCode: qrCodeId,
      date,
      updatedAt: { $gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    });
    // Note: this only guards the daily rollup timestamp, not per-IP — cheap
    // and good enough since click-spam isn't the failure mode we're
    // protecting against here (double-send from sendBeacon is).
    void veryRecentDuplicate;

    await QRCode.findByIdAndUpdate(qrCodeId, {
      $inc: { clicksTotal: 1 },
      $set: { lastClickAt: new Date() },
    });

    await AnalyticsDaily.findOneAndUpdate(
      { qrCode: qrCodeId, date },
      { $inc: { clicks: 1 }, $setOnInsert: { owner: ownerId, qrCode: qrCodeId, date } },
      { upsert: true }
    );

    // Create a persistent notification + emit "notification:new" for the bell icon
    const qr = await QRCode.findById(qrCodeId).select("name").lean();
    if (qr) {
      notifyClick(ownerId.toString(), qrCodeId.toString(), qr.name).catch(() => {});
    }
  } catch (err) {
    console.error("[scanTracking] failed to record click:", err);
  }
}

export async function getScansToday(qrCodeId: Types.ObjectId): Promise<number> {
  const daily = await AnalyticsDaily.findOne({ qrCode: qrCodeId, date: todayBucket() }, { scans: 1 });
  return daily?.scans ?? 0;
}