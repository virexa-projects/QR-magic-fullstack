import { z } from "zod";
import { QRType } from "@app-types/enums";

const designSchema = z.object({
  fgColor: z.string().optional(),
  bgColor: z.string().optional(),
  eyeColor: z.string().optional(),
  dotStyle: z.enum(["square", "rounded", "dots"]).optional(),
  frame: z.enum(["none", "rounded", "scan-me"]).optional(),
  logo: z.string().optional(),
  bannerColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const labeledItemSchema = z.object({
  label: z.string().optional().default(""),
  value: z.string(),
});

const contentSchema = z
  .object({
    url: z.string().optional(),
    text: z.string().optional(),
    phone: z.string().optional(),
    message: z.string().optional(),
    ssid: z.string().optional(),
    password: z.string().optional(),
    encryption: z.enum(["WPA", "WEP", "nopass"]).optional(),
    fullName: z.string().optional(),
    role: z.string().optional(),
    company: z.string().optional(),
    phones: z.array(labeledItemSchema).optional(),
    emails: z.array(labeledItemSchema).optional(),
    socials: z.array(labeledItemSchema).optional(),
    email: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  })
  .partial()
  .catchall(z.any());

export const createQrSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    type: z.nativeEnum(QRType),
    destination: z.string().min(1),
    content: contentSchema.optional().default({}),
    isDynamic: z.boolean().optional().default(true),
    design: designSchema.optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const updateQrSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    destination: z.string().min(1).optional(),
    content: contentSchema.optional(),
    status: z.enum(["active", "paused"]).optional(),
    design: designSchema.optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid QR code id"),
  }),
});

export const listQrSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["active", "paused", "expired"]).optional(),
    type: z.nativeEnum(QRType).optional(),
    search: z.string().optional(),
    sort: z.enum(["recent", "scans", "name"]).optional(), // added
  }),
});