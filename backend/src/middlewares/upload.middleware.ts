// middlewares/upload.middleware.ts

import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { Request } from "express";
import { ApiError } from "@utils/ApiError";

// All uploaded logos land here. Adjust to wherever you want persistent
// storage to live — on a single-server deploy this is fine; on a
// multi-instance/serverless deploy you'd want S3/Cloud Storage instead
// (see the note at the bottom of this file).
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
export const LOGO_DIR = path.join(UPLOAD_ROOT, "logos");

// Ensure the directory exists at startup — multer will NOT create it
// for you and will fail with a confusing ENOENT if it's missing.
fs.mkdirSync(LOGO_DIR, { recursive: true });

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/svg+xml"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || guessExt(file.mimetype);
    cb(null, `${uuid()}${ext}`);
  },
});

function guessExt(mime: string) {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/svg+xml") return ".svg";
  return "";
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new ApiError(400, "Only PNG, JPEG, or SVG images are allowed") as any);
    return;
  }
  cb(null, true);
}

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

// --- Production note -------------------------------------------------
// Disk storage only works if your app runs on a single persistent
// server/volume. If you deploy to multiple instances behind a load
// balancer, or anywhere serverless/ephemeral (Vercel, Lambda, most
// container platforms without a mounted volume), files written here
// vanish or aren't visible to other instances. In that case swap
// `multer.diskStorage` for `multer.memoryStorage()` and upload
// `req.file.buffer` to S3 / Cloudflare R2 / GCS in the controller
// instead of writing to local disk.


export const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});