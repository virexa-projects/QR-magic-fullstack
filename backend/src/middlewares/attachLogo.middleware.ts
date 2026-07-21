// middlewares/attachLogo.middleware.ts
import { Request, Response, NextFunction } from "express";
import { uploadBufferToCloudinary } from "@services/cloudinaryUpload.service";
import { ApiError } from "@utils/ApiError";

export async function attachLogo(req: Request, _res: Response, next: NextFunction) {
  const isMultipart = req.is("multipart/form-data");
  if (!isMultipart) return next();

  for (const key of ["design", "content"]) {
    const raw = (req.body as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.length > 0) {
      try {
        (req.body as Record<string, unknown>)[key] = JSON.parse(raw);
      } catch {
        // leave as-is — validate() below will reject with a clear error
      }
    }
  }

  for (const key of ["isDynamic", "removeLogo"]) {
    const raw = (req.body as Record<string, unknown>)[key];
    if (raw === "true") (req.body as Record<string, unknown>)[key] = true;
    else if (raw === "false") (req.body as Record<string, unknown>)[key] = false;
  }

  const design = (req.body.design ?? {}) as Record<string, unknown>;

  try {
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, "logos", "image");
      design.logo = uploaded.url;
    } else if (req.body.removeLogo === true) {
      design.logo = undefined;
    }
  } catch (err) {
    return next(ApiError.badRequest("Logo upload failed. Please try again."));
  }

  req.body.design = design;
  next();
}