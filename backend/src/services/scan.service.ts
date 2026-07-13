import { QRCode } from "@models/QRCode.model";
import { Scan } from "@models/Scan.model";
import { AnalyticsDaily } from "@models/AnalyticsDaily.model";
import { ApiError } from "@utils/ApiError";
import { QRStatus } from "@app-types/enums";
import { getIO } from "@sockets/io";
import { format } from "date-fns";
import { getISTHour } from "@utils/time";
interface RecordScanInput {
  shortCode: string;
  ip: string;
  userAgent: string;
  device: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
  referrer?: string;
}

/**
 * Records a scan and returns the destination to redirect the visitor to.
 * Designed to be fast: one QR lookup + fire-and-forget writes for analytics.
 */
export async function recordScanAndResolve(input: RecordScanInput): Promise<{ destination: string; type: string }> {
  const qr = await QRCode.findOne({ shortCode: input.shortCode });
  if (!qr) throw ApiError.notFound("QR code not found");
  if (qr.status === QRStatus.PAUSED) throw ApiError.forbidden("This QR code is currently paused");
  if (qr.expiresAt && qr.expiresAt < new Date()) {
    qr.status = QRStatus.EXPIRED;
    await qr.save();
    throw ApiError.forbidden("This QR code has expired");
  }

  const now = new Date();
  const dateBucket = format(now, "yyyy-MM-dd");
 const hour = getISTHour();

  // Fire-and-forget analytics writes so redirect latency stays low.
  // Errors are logged but never block/redirect failure for the end user.
  void Promise.all([
    Scan.create({
      qrCode: qr._id,
      owner: qr.owner,
      ip: input.ip,
      userAgent: input.userAgent,
      device: input.device,
      browser: input.browser,
      os: input.os,
      country: input.country,
      region: input.region,
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      referrer: input.referrer,
      scannedAt: now,
    }),
    QRCode.updateOne(
      { _id: qr._id },
      { $inc: { scansTotal: 1, scansToday: 1 }, $set: { lastScanAt: now } }
    ),
    AnalyticsDaily.updateOne(
      { qrCode: qr._id, date: dateBucket },
      {
        $inc: {
          scans: 1,
          [`deviceBreakdown.${input.device}`]: 1,
          [`countryBreakdown.${input.country || "Unknown"}`]: 1,
          [`hourlyBreakdown.${hour}`]: 1,
        },
        $setOnInsert: { owner: qr.owner, qrCode: qr._id, date: dateBucket },
      },
      { upsert: true }
    ),
  ]).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Scan analytics write failed:", err);
  });

  // Real-time push to any connected dashboard clients watching this QR/owner
  try {
    const io = getIO();
    io.to(`user:${qr.owner.toString()}`).emit("scan:new", {
      qrId: qr._id.toString(),
      qrName: qr.name,
      device: input.device,
      city: input.city,
      country: input.country,
      scannedAt: now,
    });
  } catch {
    /* socket layer not ready - non-critical */
  }

  return { destination: qr.destination, type: qr.type };
}
