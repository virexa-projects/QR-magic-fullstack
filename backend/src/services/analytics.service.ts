import { Types } from "mongoose";
import { subDays, format } from "date-fns";
import { QRCode } from "@models/QRCode.model";
import { AnalyticsDaily } from "@models/AnalyticsDaily.model";
import { Scan } from "@models/Scan.model";
import { cacheGetOrSet } from "@config/redis";

export async function getDashboardSummary(ownerId: string) {
  return cacheGetOrSet(`analytics:summary:${ownerId}`, 30, async () => {
    const ownerObjectId = new Types.ObjectId(ownerId);

    const [totalQRs, activeQRs, aggregate] = await Promise.all([
      QRCode.countDocuments({ owner: ownerObjectId }),
      QRCode.countDocuments({ owner: ownerObjectId, status: "active" }),
      QRCode.aggregate([
        { $match: { owner: ownerObjectId } },
        {
          $group: {
            _id: null,
            totalScans: { $sum: "$scansTotal" },
            scansToday: { $sum: "$scansToday" },
          },
        },
      ]),
    ]);

    const totals = aggregate[0] || { totalScans: 0, scansToday: 0 };

    return {
      totalQRs,
      activeQRs,
      totalScans: totals.totalScans,
      scansToday: totals.scansToday,
    };
  });
}

export async function getScansTrend(ownerId: string, days = 30) {
  return cacheGetOrSet(`analytics:trend:${ownerId}:${days}`, 60, async () => {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

    const rows = await AnalyticsDaily.aggregate([
      { $match: { owner: ownerObjectId, date: { $gte: startDate } } },
      { $group: { _id: "$date", scans: { $sum: "$scans" } } },
      { $sort: { _id: 1 } },
    ]);

    const map = new Map(rows.map((r) => [r._id as string, r.scans as number]));
    const result = Array.from({ length: days }).map((_, i) => {
      const day = subDays(new Date(), days - 1 - i);
      const key = format(day, "yyyy-MM-dd");
      return { date: format(day, "MMM d"), scans: map.get(key) || 0 };
    });

    return result;
  });
}

export async function getDeviceBreakdown(ownerId: string, days = 30) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

  const rows = await AnalyticsDaily.find({ owner: ownerObjectId, date: { $gte: startDate } })
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

export async function getLocationBreakdown(ownerId: string, limit = 10) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const rows = await Scan.aggregate([
    { $match: { owner: ownerObjectId, country: { $exists: true, $ne: null } } },
    { $group: { _id: { country: "$country", city: "$city" }, scans: { $sum: 1 } } },
    { $sort: { scans: -1 } },
    { $limit: limit },
  ]);

  return rows.map((r) => ({ country: r._id.country, city: r._id.city, scans: r.scans }));
}

export async function getHourlyHeatmap(ownerId: string, days = 7) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

  const rows = await AnalyticsDaily.find({ owner: ownerObjectId, date: { $gte: startDate } })
    .select("hourlyBreakdown")
    .lean();

  const hourly = new Array(24).fill(0);
  for (const row of rows) {
    row.hourlyBreakdown?.forEach((v, i) => (hourly[i] += v));
  }
  return hourly.map((scans, hour) => ({ hour: `${hour.toString().padStart(2, "0")}:00`, scans }));
}

/**
 * Per-QR daily rollup for the detail page. Gap-filled to a fixed-length
 * series (like getScansTrend) so the chart never has to guess at missing
 * days — days with no AnalyticsDaily doc render as zero rather than being
 * skipped entirely, which would otherwise compress the x-axis.
 */
export async function getQrAnalytics(ownerId: string, qrId: string, days = 30) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

  const rows = await AnalyticsDaily.find({
    owner: ownerObjectId,
    qrCode: qrObjectId,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .lean();

  const byDate = new Map(rows.map((r) => [r.date, r]));

  return Array.from({ length: days }).map((_, i) => {
    const day = subDays(new Date(), days - 1 - i);
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
 * NEW: city-level breakdown scoped to ONE QR — getLocationBreakdown above
 * is account-wide, which is wrong for a single QR's detail page. Reads
 * directly from Scan (not AnalyticsDaily) because AnalyticsDaily only
 * rolls up country, not city.
 */
export async function getQrLocationBreakdown(ownerId: string, qrId: string, limit = 6) {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const qrObjectId = new Types.ObjectId(qrId);

  const rows = await Scan.aggregate([
    { $match: { owner: ownerObjectId, qrCode: qrObjectId, city: { $exists: true, $ne: null } } },
    { $group: { _id: { city: "$city", country: "$country" }, scans: { $sum: 1 } } },
    { $sort: { scans: -1 } },
    { $limit: limit },
  ]);

  const total = rows.reduce((s, r) => s + r.scans, 0) || 1;
  return rows.map((r) => ({
    city: r._id.city,
    country: r._id.country,
    scans: r.scans,
    pct: Math.round((r.scans / total) * 100),
  }));
}

/**
 * NEW: the last N raw scan events for one QR — powers the "recent scans"
 * list with real hits instead of placeholder rows.
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