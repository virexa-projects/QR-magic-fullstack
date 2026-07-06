import { FilterQuery } from "mongoose";
import { QRCode, IQRCode } from "@models/QRCode.model";
import { ApiError } from "@utils/ApiError";
import { generateShortCode } from "@utils/shortCode";
import { buildQrPayload, renderQrPngDataUrl } from "@utils/qrRenderer";
import { cacheInvalidate } from "@config/redis";
import { env } from "@config/env";
import { QRType, QRStatus } from "@app-types/enums";

interface CreateQrInput {
  name: string;
  type: QRType;
  destination: string;
  isDynamic?: boolean;
  design?: Partial<IQRCode["design"]>;
  expiresAt?: string;
}

export async function createQr(ownerId: string, input: CreateQrInput) {
  let shortCode = generateShortCode();
  // Extremely low collision odds with nanoid(8), but guard anyway for correctness at scale
  // eslint-disable-next-line no-constant-condition
  while (await QRCode.exists({ shortCode })) {
    shortCode = generateShortCode();
  }

  const qr = await QRCode.create({
    owner: ownerId,
    name: input.name,
    type: input.type,
    destination: input.destination,
    shortCode,
    isDynamic: input.isDynamic ?? true,
    design: input.design ?? {},
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });

  const shortUrl = `${env.SHORT_URL_BASE}/${qr.shortCode}`;
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
  opts: { page: number; limit: number; status?: QRStatus; type?: QRType; search?: string }
) {
  const filter: FilterQuery<IQRCode> = { owner: ownerId };
  if (opts.status) filter.status = opts.status;
  if (opts.type) filter.type = opts.type;
  if (opts.search) filter.name = { $regex: opts.search, $options: "i" };

  const skip = (opts.page - 1) * opts.limit;

  const [items, total] = await Promise.all([
    QRCode.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).lean(),
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

export async function updateQr(
  ownerId: string,
  id: string,
  updates: Partial<Pick<IQRCode, "name" | "destination" | "status">> & {
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

  if (updates.design) qr.design = { ...qr.design, ...updates.design } as IQRCode["design"];

  await qr.save();
  await cacheInvalidate(`qr:list:${ownerId}`, true);
  await cacheInvalidate(`qr:redirect:${qr.shortCode}`);

  return qr;
}

export async function deleteQr(ownerId: string, id: string, isPrivileged = false) {
  const qr = await getQrById(ownerId, id, isPrivileged);
  await qr.deleteOne();
  await cacheInvalidate(`qr:list:${ownerId}`, true);
  await cacheInvalidate(`qr:redirect:${qr.shortCode}`);
}
