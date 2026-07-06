import { FilterQuery } from "mongoose";
import { QRCode, IQRCode } from "@models/QRCode.model";
import { ApiError } from "@utils/ApiError";
import { generateShortCode } from "@utils/shortCode";
import { buildQrPayload, renderQrPngDataUrl } from "@utils/qrRenderer";
import { cacheInvalidate } from "@config/redis";
import { env } from "@config/env";
import { QRType, QRStatus } from "@app-types/enums";
import { User } from "@models/User.model";
import { Plan, IPlan } from "@models/Plan.model";

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
  // 1. Fetch user and populate their active tier
  const user = await User.findById(ownerId).populate<{ currentPlan: IPlan | null }>("currentPlan");
  if (!user) {
    throw ApiError.unauthorized("User account does not exist.");
  }

  const plan = user.currentPlan;

  // 2. Enforce subscription presence & active window validations
  if (!plan || !user.isActive) {
    throw ApiError.forbidden("No active subscription plan found. Please subscribe to clear limits.");
  }

  if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
    throw ApiError.forbidden("Your subscription plan has expired. Please renew your access tier.");
  }

  // 3. Evaluate total QR capacity ceilings
  const totalCount = await QRCode.countDocuments({ owner: ownerId });
  if (plan.qrLimit !== -1 && totalCount >= plan.qrLimit) {
    throw ApiError.badRequest(`Plan limit reached. Your '${plan.name}' plan permits a maximum of ${plan.qrLimit} QR codes.`);
  }

  // 4. Evaluate Dynamic QR capacities
  if (isRequestedDynamic) {
    const dynamicCount = await QRCode.countDocuments({ owner: ownerId, isDynamic: true });
    if (plan.dynamicQrLimit !== -1 && dynamicCount >= plan.dynamicQrLimit) {
      throw ApiError.badRequest(`Dynamic QR tier ceiling met. Your plan allows up to ${plan.dynamicQrLimit} dynamic redirects.`);
    }
  }

  // 5. Explicit structural/premium feature evaluations
  const reqTypeNormalized = String(reqType).toLowerCase();

  if (reqTypeNormalized === "vcard" && !plan.features.includes("vcard") && plan.slug === "free") {
    throw ApiError.forbidden("vCard digital cards are unavailable on your current tier.");
  }

  if (hasLogo && !plan.features.includes("logoUpload") && plan.slug === "free") {
    throw ApiError.forbidden("Logo styling features require a premium subscription tier upgrade.");
  }
}

export async function createQr(ownerId: string, input: CreateQrInput) {
  const hasLogo = Boolean(input.design?.logo);

  // Was previously never called — this is what actually enforces plan limits.
  await validateSubscriptionAndLimits(ownerId, input.type, input.isDynamic ?? true, hasLogo);

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
    content: input.content ?? {}, // preserves per-type structured fields (vcard phones, wifi ssid, etc.)
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