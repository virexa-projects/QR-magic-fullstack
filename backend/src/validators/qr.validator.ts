import { z } from "zod";
import { QRType } from "@app-types/enums";

const designSchema = z.object({
  fgColor: z.string().optional(),
  bgColor: z.string().optional(),
  eyeColor: z.string().optional(),
  dotStyle: z.enum(["square", "rounded", "dots"]).optional(),
  frame: z.enum(["none", "rounded", "scan-me"]).optional(),
  logo: z.string().optional(),
});

export const createQrSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    type: z.nativeEnum(QRType),
    destination: z.string().min(1),
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
    status: z.enum(["active", "paused"]).optional(),
    design: designSchema.optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const listQrSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["active", "paused", "expired"]).optional(),
    type: z.nativeEnum(QRType).optional(),
    search: z.string().optional(),
  }),
});
