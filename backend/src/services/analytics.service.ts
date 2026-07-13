import { Types } from "mongoose";
import {
  format,
  startOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { QRCode } from "@models/QRCode.model";
import { AnalyticsDaily } from "@models/AnalyticsDaily.model";
import { Scan } from "@models/Scan.model";
import { cacheGetOrSet } from "@config/redis";

/* ------------------------------------------------------------------ */
/*  Shared date-range resolver                                         */
/* ------------------------------------------------------------------ */

/**
 * Resolves a start/end Date pair for any analytics query.
 * - If startDate/endDate are provided (yyyy-MM-dd strings), use them.
 * - Otherwise defaults to the current calendar month, from the 1st
 *   through the end of today.
 *
 * NOTE: this uses the server's local timezone via `new Date()` /
 * `startOfDay` / `endOfDay`. If your server runs in UTC but your users
 * are in IST, "today" can be off by up to 5.5 hours around midnight.
 * If that's an issue, swap these for date-fns-tz equivalents pinned to
 * "Asia/Kolkata".
 */
function resolveRange(startDate?: string, endDate?: string) {
  const now = new Date();
  const start = startDate ? startOfDay(new Date(startDate)) : startOfMonth(now);
  const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(now);
  return { start, end };
}

/* ------------------------------------------------------------------ */
/*  Dashboard summary — now computes totals/today LIVE from Scan       */
/*  instead of trusting denormalized scansTotal/scansToday fields on   */
/*  QRCode, which can silently drift if the increment/reset job stalls */
/*  or the midnight reset runs in the wrong timezone.                  */
/* ------------------------------------------------------------------ */

export async function getDashboardSummary(
  ownerId: string,
  startDate?: string,
  endDate?: string
) {
  const cacheKey = `analytics:summary:${ownerId}:${startDate || "m"}:${endDate || "m"}`;
  return cacheGetOrSet(cacheKey, 30, async () => {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const { start, end } = resolveRange(startDate, endDate);

    // "Scans today" is always the real current day, regardless of the
    // range filter applied to the rest of the dashboard.
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [totalQRs, activeQRs, totalScans, scansToday] = await Promise.all([
      QRCode.countDocuments({ owner: ownerObjectId }),
      QRCode.countDocuments({ owner: ownerObjectId, status: "active" }),
      Scan.countDocuments({ owner: ownerObjectId, scannedAt: { $gte: start, $lte: end } }),
      Scan.countDocuments({ owner: ownerObjectId, scannedAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    return { totalQRs, activeQRs, totalScans, scansToday };
  });
}

/* ------------------------------------------------------------------ */
/*  Trend / devices / hourly — now date-range aware (default: month)   */
/* ------------------------------------------------------------------ */

export async function getScansTrend(ownerId: string, startDate?: string, endDate?: string) {
  const cacheKey = `analytics:trend:${ownerId}:${startDate || "m"}:${endDate || "m"}`;
  return cacheGetOrSet(cacheKey, 60, async () => {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const { start, end } = resolveRange(startDate, endDate);
    const startKey = format(start, "yyyy-MM-dd");
    const endKey = format(end, "yyyy-MM-dd");

    const rows = await AnalyticsDaily.aggregate([
      { $match: { owner: ownerObjectId, date: { $gte: startKey, $lte: endKey } } },
      { $group: { _id: "$date", scans: { $sum: "$scans" } } },
      { $sort: { _id: 1 } },
    ]);

    const map = new Map(rows.map((r) => [r._id as string, r.scans as number]));
    const days = differenceInCalendarDays(end, start) + 1;

    return Array.from({ length: days }).map((_, i) => {
      const day = addDays(start, i);
      const key = format(day, "yyyy-MM-dd");
      return { date: format(day, "MMM d"), scans: map.get(key) || 0 };
    });
  });
}

export async function getDeviceBreakdown(ownerId: string, startDate?: string, endDate?: string) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const { start, end } = resolveRange(startDate, endDate);

  const rows = await AnalyticsDaily.find({
    owner: ownerObjectId,
    date: { $gte: format(start, "yyyy-MM-dd"), $lte: format(end, "yyyy-MM-dd") },
  })
    .select("deviceBreakdown")
    .lean();

  const totals: Record<string, number> = {};
  for (const row of rows) {
    for (const [device, count] of Object.entries(row.deviceBreakdown || {})) {
      totals[device] = (totals[device] || 0) + (count as number);
    }
  }
  return totals;
}

/**
 * Also returns avgLat/avgLng per city (averaged across that city's Scan
 * docs) and a pct of total scans, so the frontend WorldMap has
 * coordinates to plot without a second lookup, and the "Top cities"
 * list doesn't need to compute percentages client-side.
 *
 * Kept limit-based (not date-range filtered) to match current frontend
 * usage — pass startDate/endDate through here too if you want the map
 * to respect the date picker.
 */
export async function getLocationBreakdown(
  ownerId: string,
  limit = 10,
  startDate?: string,
  endDate?: string
) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const match: Record<string, unknown> = {
    owner: ownerObjectId,
    country: { $exists: true, $ne: null },
  };

  if (startDate || endDate) {
    const { start, end } = resolveRange(startDate, endDate);
    match.scannedAt = { $gte: start, $lte: end };
  }

  const rows = await Scan.aggregate([
    { $match: match },
    {
      $group: {
        _id: { country: "$country", city: "$city" },
        scans: { $sum: 1 },
        avgLat: { $avg: "$lat" },
        avgLng: { $avg: "$lng" },
      },
    },
    { $sort: { scans: -1 } },
    { $limit: limit },
  ]);

  const total = rows.reduce((s, r) => s + r.scans, 0) || 1;

  return rows.map((r) => ({
    country: r._id.country,
    city: r._id.city,
    scans: r.scans,
    pct: Math.round((r.scans / total) * 100),
    lat: r.avgLat ?? null,
    lng: r.avgLng ?? null,
  }));
}

export async function getHourlyHeatmap(ownerId: string, startDate?: string, endDate?: string) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const { start, end } = resolveRange(startDate, endDate);

  const rows = await AnalyticsDaily.find({
    owner: ownerObjectId,
    date: { $gte: format(start, "yyyy-MM-dd"), $lte: format(end, "yyyy-MM-dd") },
  })
    .select("hourlyBreakdown")
    .lean();

  const hourly = new Array(24).fill(0);
  for (const row of rows) {
    row.hourlyBreakdown?.forEach((v, i) => (hourly[i] += v));
  }
  return hourly.map((scans, hour) => ({ hour: `${hour.toString().padStart(2, "0")}:00`, scans }));
}

/* ------------------------------------------------------------------ */
/*  Per-QR analytics — now date-range aware (default: current month)   */
/* ------------------------------------------------------------------ */

export async function getQrAnalytics(
  ownerId: string,
  qrId: string,
  startDate?: string,
  endDate?: string
) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);
  const { start, end } = resolveRange(startDate, endDate);
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");

  const rows = await AnalyticsDaily.find({
    owner: ownerObjectId,
    qrCode: qrObjectId,
    date: { $gte: startKey, $lte: endKey },
  })
    .sort({ date: 1 })
    .lean();

  const byDate = new Map(rows.map((r) => [r.date, r]));
  const days = differenceInCalendarDays(end, start) + 1;

  return Array.from({ length: days }).map((_, i) => {
    const day = addDays(start, i);
    const key = format(day, "yyyy-MM-dd");
    const row = byDate.get(key);
    return {
      date: key,
      label: format(day, "MMM d"),
      scans: row?.scans ?? 0,
      clicks: row?.clicks ?? 0,
      uniqueIps: row?.uniqueIps ?? 0,
      deviceBreakdown: row?.deviceBreakdown ?? {},
      countryBreakdown: row?.countryBreakdown ?? {},
      hourlyBreakdown: row?.hourlyBreakdown ?? new Array(24).fill(0),
    };
  });
}

/**
 * Live "scans today" count for a single QR — mirrors the account-wide
 * summary's approach. Always the real current day, independent of
 * whatever date range is selected in the UI, and independent of the
 * denormalized scansToday field on the QRCode doc (which can drift).
 */
export async function getQrScansToday(ownerId: string, qrId: string) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const scansToday = await Scan.countDocuments({
    owner: ownerObjectId,
    qrCode: qrObjectId,
    scannedAt: { $gte: todayStart, $lte: todayEnd },
  });

  return { scansToday };
}

/**
 * Per-QR city breakdown. Kept limit-based to match current frontend
 * usage (no date picker wired to this call yet).
 */
export async function getQrLocationBreakdown(ownerId: string, qrId: string, limit = 6) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);

  const rows = await Scan.aggregate([
    { $match: { owner: ownerObjectId, qrCode: qrObjectId, city: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { city: "$city", country: "$country" },
        scans: { $sum: 1 },
        avgLat: { $avg: "$lat" },
        avgLng: { $avg: "$lng" },
      },
    },
    { $sort: { scans: -1 } },
    { $limit: limit },
  ]);

  const total = rows.reduce((s, r) => s + r.scans, 0) || 1;
  return rows.map((r) => ({
    city: r._id.city,
    country: r._id.country,
    scans: r.scans,
    pct: Math.round((r.scans / total) * 100),
    lat: r.avgLat ?? null,
    lng: r.avgLng ?? null,
  }));
}

/**
 * The last N raw scan events for one QR — powers the "recent scans"
 * list with real hits instead of placeholder rows. Always "most
 * recent N", independent of the date-range filter.
 */
export async function getRecentScans(ownerId: string, qrId: string, limit = 8) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);

  const rows = await Scan.find({ owner: ownerObjectId, qrCode: qrObjectId })
    .sort({ scannedAt: -1 })
    .limit(limit)
    .select("city country device browser os scannedAt")
    .lean();

  return rows.map((r) => ({
    city: r.city || r.country || "Unknown",
    device: r.device,
    browser: r.browser,
    scannedAt: r.scannedAt,
  }));
}

// OVERVIEW PERDAY DATA 

export async function getTopQRs(ownerId: string, limit = 4) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // Live count of today's scans per QR — same reasoning as getDashboardSummary:
  // don't trust the denormalized scansToday field on QRCode.
  const rows = await Scan.aggregate([
    { $match: { owner: ownerObjectId, scannedAt: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: "$qrCode", scansToday: { $sum: 1 } } },
    { $sort: { scansToday: -1 } },
    { $limit: limit },
  ]);

  const qrIds = rows.map((r) => r._id);
  const qrDocs = await QRCode.find({ _id: { $in: qrIds }, owner: ownerObjectId })
    .select("name type destination scansTotal")
    .lean();

  const qrMap = new Map(qrDocs.map((q) => [q._id.toString(), q]));

  return rows
    .map((r) => {
      const qr = qrMap.get(r._id.toString());
      if (!qr) return null;
      return {
        id: r._id.toString(),
        name: qr.name,
        type: qr.type,
        destination: qr.destination,
        scansToday: r.scansToday,
        scans: qr.scansTotal,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}