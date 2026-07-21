import multer from "multer";
import { ApiError } from "@utils/ApiError";

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];

export const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p))) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`) as any);
    }
    cb(null, true);
  },
});

// Logo-specific: images only, tighter 2MB cap to match the frontend check
// in Step3Qr.tsx (MAX_LOGO_SIZE_MB = 2).
const ALLOWED_LOGO_MIME = ["image/png", "image/jpeg", "image/svg+xml"];

export const uploadLogo = multer({
  storage: multer.memoryStorage(), // no disk write — buffer goes straight to Cloudinary
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_LOGO_MIME.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported logo type: ${file.mimetype}. Use PNG, JPEG, or SVG.`) as any);
    }
    cb(null, true);
  },
});