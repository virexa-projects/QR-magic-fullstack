// middlewares/attachLogo.middleware.ts
import { Request, Response, NextFunction } from "express";
import { env } from "@config/env";

/**
 * Runs AFTER uploadLogo.single("logo") on the PATCH /qr/:id route, and
 * BEFORE validate(updateQrSchema).
 *
 * multer only parses the file — every other field in a multipart body
 * arrives in req.body as a plain STRING, including fields meant to be
 * JSON objects (design, content). This middleware:
 *   1. Parses those JSON-string fields back into objects
 *   2. If a file was uploaded, merges its public URL into design.logo
 *   3. If the client asked to remove the logo (removeLogo=true, no file),
 *      clears design.logo
 *
 * Critically, it always calls next() — it never sends a response itself.
 * The old version (uploadLogoHandler) called sendSuccess() here, which
 * ended the request before qrController.update ever ran, so PATCH
 * requests silently never persisted anything to the QR document beyond
 * the upload log itself.
 */
export function attachLogo(req: Request, _res: Response, next: NextFunction) {
  const isMultipart = req.is("multipart/form-data");
  if (!isMultipart) return next(); // plain JSON PATCHes skip this untouched

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

  const design = (req.body.design ?? {}) as Record<string, unknown>;

  if (req.file) {
    design.logo = `${env.API_BASE_URL}/uploads/logos/${req.file.filename}`;
  } else if (req.body.removeLogo === "true" || req.body.removeLogo === true) {
    design.logo = undefined;
  }

  req.body.design = design;
  next();
}