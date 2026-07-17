import { FilterQuery } from "mongoose";
import fs from "fs/promises";
import path from "path";
import { QRCode, IQRCode } from "@models/QRCode.model";
import { ApiError } from "@utils/ApiError";
import { generateShortCode } from "@utils/shortCode";
import { buildQrPayload, renderQrPngDataUrl } from "@utils/qrRenderer";
import { cacheInvalidate } from "@config/redis";
import { env } from "@config/env";
import { QRType, QRStatus } from "@app-types/enums";
import { User } from "@models/User.model";
import { Plan, IPlan } from "@models/Plan.model";
import { LOGO_DIR } from "@middlewares/upload.middleware";

interface CreateQrInput {
  name: string;
  type: QRType;
  destination: string;
  content?: Record<string, any>;
  isDynamic?: boolean;
  design?: Partial<IQRCode["design"]>;
  expiresAt?: string;
}

async function validateSubscriptionAndLimits(
  ownerId: string,
  reqType: QRType,
  isRequestedDynamic: boolean,
  hasLogo: boolean
): Promise<void> {
  const user = await User.findById(ownerId).populate<{ currentPlan: IPlan | null }>("currentPlan");
  if (!user) {
    throw ApiError.unauthorized("User account does not exist.");
  }

  const plan = user.currentPlan;

  if (!plan || !user.isActive) {
    throw ApiError.forbidden("No active subscription plan found. Please subscribe to clear limits.");
  }

  if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
    throw ApiError.forbidden("Your subscription plan has expired. Please renew your access tier.");
  }

  const totalCount = await QRCode.countDocuments({ owner: ownerId });
  if (plan.qrLimit !== -1 && totalCount >= plan.qrLimit) {
    throw ApiError.badRequest(`Plan limit reached. Your '${plan.name}' plan permits a maximum of ${plan.qrLimit} QR codes.`);
  }

  if (isRequestedDynamic) {
    const dynamicCount = await QRCode.countDocuments({ owner: ownerId, isDynamic: true });
    if (plan.dynamicQrLimit !== -1 && dynamicCount >= plan.dynamicQrLimit) {
      throw ApiError.badRequest(`Dynamic QR tier ceiling met. Your plan allows up to ${plan.dynamicQrLimit} dynamic redirects.`);
    }
  }

  const reqTypeNormalized = String(reqType).toLowerCase();

  if (reqTypeNormalized === "vcard" && !plan.features.includes("vcard") && plan.slug === "free") {
    throw ApiError.forbidden("vCard digital cards are unavailable on your current tier.");
  }

  if (hasLogo && !plan.features.includes("logoUpload") && plan.slug === "free") {
    throw ApiError.forbidden("Logo styling features require a premium subscription tier upgrade.");
  }
}

function deleteLocalLogoIfOwned(logoUrl?: string | null) {
  if (!logoUrl) return;
  const prefix = `${env.API_BASE_URL}/uploads/logos/`;
  if (!logoUrl.startsWith(prefix)) return;
  const filename = logoUrl.slice(prefix.length);
  if (!filename || filename.includes("/") || filename.includes("..")) return;
  fs.unlink(path.join(LOGO_DIR, filename)).catch(() => {});
}

/**
 * Resolves a QR's structured `content` into the literal href a phone
 * should be sent to when it hits the redirect route. Every type except
 * `vcard` (handled separately — it streams a .vcf, it doesn't redirect)
 * is covered here.
 */
export function buildDestinationHref(qr: IQRCode): string {
  const { type, content = {}, destination } = qr;

  switch (type) {
    case QRType.URL:
      return content.url || destination;

    case QRType.WHATSAPP: {
      const phone = (content.phone || "").replace(/\D/g, "");
      const msg = content.message ? `?text=${encodeURIComponent(content.message)}` : "";
      return `https://wa.me/${phone}${msg}`;
    }

    case QRType.PHONE:
      return `tel:${content.phone || ""}`;

    case QRType.SMS: {
      const body = content.message ? `?body=${encodeURIComponent(content.message)}` : "";
      return `sms:${content.phone || ""}${body}`;
    }

    case QRType.EMAIL: {
      const subject = encodeURIComponent(content.subject || "");
      const body = encodeURIComponent(content.body || "");
      return `mailto:${content.email || ""}?subject=${subject}&body=${body}`;
    }

    case QRType.LOCATION: {
      const lat = content.latitude || "0";
      const lng = content.longitude || "0";
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    case QRType.WIFI: {
      // Browsers have no app handler for a bare WIFI: scheme reached via
      // HTTP redirect — real auto-join only happens when a camera reads
      // the raw QR content directly, not through a dynamic/trackable
      // link. Included as requested, but expect this to just show a
      // blank/error page on real devices rather than joining the network.
      const enc = content.encryption || "WPA";
      const ssid = content.ssid || "";
      const password = content.password || "";
      return `WIFI:T:${enc};S:${ssid};P:${password};;`;
    }

    case QRType.UPI: {
      const upiId = content.upiId || "";
      const name = content.name || "";
      const amount = content.amount || "0.00";
      const note = content.note ? `&tn=${encodeURIComponent(content.note)}` : "";
      // Android-only in practice — iOS Safari has no upi:// handler.
      return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(amount)}${note}`;
    }

    default:
      return destination;
  }
}

export async function createQr(ownerId: string, input: CreateQrInput) {
  const hasLogo = Boolean(input.design?.logo);

  await validateSubscriptionAndLimits(ownerId, input.type, input.isDynamic ?? true, hasLogo);

  let shortCode = generateShortCode();
  // eslint-disable-next-line no-constant-condition
  while (await QRCode.exists({ shortCode })) {
    shortCode = generateShortCode();
  }

  // IMPORTANT: this is what actually gets encoded into the printed QR
  // image (via buildQrPayload below). It must point at the BACKEND
  // redirect route, not the frontend — that's what makes scanning the
  // physical QR auto-redirect straight to WhatsApp/tel/wifi/etc. instead
  // of opening a browser tab on your Next.js app first.
  // env.API_BASE_URL must be your publicly reachable backend origin
  // (not localhost) since a scanning phone hits this directly.
  const shortUrl = `${env.API_BASE_URL}/qr/r/${shortCode}`;

  const qr = await QRCode.create({
    owner: ownerId,
    name: input.name,
    type: input.type,
    destination: input.destination,
    content: input.content ?? {},
    shortCode,
    shortUrl,
    isDynamic: input.isDynamic ?? true,
    design: input.design ?? {},
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });

  const payload = buildQrPayload({
    isDynamic: qr.isDynamic,
    shortUrl,
    type: qr.type,
    destination: qr.destination,
  });
  const imageDataUrl = await renderQrPngDataUrl(payload, qr.design);

  await cacheInvalidate(`qr:list:${ownerId}`, true);

  return { qr, shortUrl, imageDataUrl };
}

export async function listQrs(
  ownerId: string,
  opts: {
    page: number;
    limit: number;
    status?: QRStatus;
    type?: QRType;
    search?: string;
    sort?: "recent" | "scans" | "name";
  }
) {
  const filter: FilterQuery<IQRCode> = { owner: ownerId };
  if (opts.status) filter.status = opts.status;
  if (opts.type) filter.type = opts.type;
  if (opts.search) filter.name = { $regex: opts.search, $options: "i" };

  const skip = (opts.page - 1) * opts.limit;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    recent: { createdAt: -1 },
    scans: { scansTotal: -1 },
    name: { name: 1 },
  };
  const sortSpec = sortMap[opts.sort ?? "recent"];

  const [items, total] = await Promise.all([
    QRCode.find(filter).sort(sortSpec).skip(skip).limit(opts.limit).lean(),
    QRCode.countDocuments(filter),
  ]);

  return { items, total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit) };
}

export async function getQrById(ownerId: string, id: string, isPrivileged = false) {
  const qr = await QRCode.findById(id);
  if (!qr) throw ApiError.notFound("QR code not found");
  if (!isPrivileged && qr.owner.toString() !== ownerId) throw ApiError.forbidden("Access denied");
  return qr;
}

export async function getQrByShortCode(shortCode: string) {
  const qr = await QRCode.findOne({
    shortCode,
    status: QRStatus.ACTIVE,
  });

  if (!qr) {
    throw ApiError.notFound("QR code not found");
  }

  return qr;
}

export async function updateQr(
  ownerId: string,
  id: string,
  updates: Partial<Pick<IQRCode, "name" | "destination" | "status">> & {
    content?: Record<string, any>;
    design?: Partial<IQRCode["design"]>;
    expiresAt?: string | null;
  },
  isPrivileged = false
) {
  const qr = await getQrById(ownerId, id, isPrivileged);

  if (updates.name !== undefined) qr.name = updates.name;
  if (updates.status !== undefined) qr.status = updates.status as QRStatus;
  if (updates.expiresAt !== undefined) qr.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;

  if (updates.destination !== undefined) {
    if (!qr.isDynamic) {
      throw ApiError.badRequest("Only dynamic QR codes support destination updates without reprinting");
    }
    qr.destination = updates.destination;
  }

  if (updates.content !== undefined) {
    qr.content = { ...qr.content, ...updates.content };
  }

  if (updates.design) {
    const incomingLogo = (updates.design as any).logo;
    if (incomingLogo !== qr.design.logo) {
      deleteLocalLogoIfOwned(qr.design.logo);
    }
    qr.design = { ...qr.design, ...updates.design } as IQRCode["design"];
  }

  await qr.save();
  await cacheInvalidate(`qr:list:${ownerId}`, true);
  await cacheInvalidate(`qr:redirect:${qr.shortCode}`);

  return qr;
}

export async function deleteQr(ownerId: string, id: string, isPrivileged = false) {
  const qr = await getQrById(ownerId, id, isPrivileged);
  deleteLocalLogoIfOwned(qr.design?.logo);
  await qr.deleteOne();
  await cacheInvalidate(`qr:list:${ownerId}`, true);
  await cacheInvalidate(`qr:redirect:${qr.shortCode}`);
}