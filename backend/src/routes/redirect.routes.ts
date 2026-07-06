import { Router } from "express";
import { scanRateLimiter } from "@middlewares/rateLimiter.middleware";
import { resolveShortCode } from "@controllers/redirect.controller";

const router = Router();

// e.g. GET https://qrb.in/r/AB3xK9pQ
router.get("/:shortCode", scanRateLimiter, resolveShortCode);

export default router;
