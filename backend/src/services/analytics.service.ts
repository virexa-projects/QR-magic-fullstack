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

export async function getQrAnalytics(ownerId: string, qrId: string, days = 30) {
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  const rows = await AnalyticsDaily.find({ owner: ownerId, qrCode: qrId, date: { $gte: startDate } })
    .sort({ date: 1 })
    .lean();
  return rows;
}
