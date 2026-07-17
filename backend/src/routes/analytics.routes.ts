import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { analyticsRangeSchema } from "@validators/analytics.validator";
import { idParamSchema } from "@validators/qr.validator";
import * as analyticsController from "@controllers/analytics.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", validate(analyticsRangeSchema), analyticsController.summary);
router.get("/trend", validate(analyticsRangeSchema), analyticsController.trend);
router.get("/devices", validate(analyticsRangeSchema), analyticsController.devices);
router.get("/locations", analyticsController.locations);
router.get("/hourly", validate(analyticsRangeSchema), analyticsController.hourly);
router.get("/top-qrs", analyticsController.topQrs);
router.get(
  "/qr/:id",
  validate(idParamSchema),
  validate(analyticsRangeSchema),
  analyticsController.qrAnalytics
);
// These two were exported by the controller but never wired up —
// that's why fetchQrLocations / fetchQrRecentScans were 404ing.
router.get("/qr/:id/locations", validate(idParamSchema), analyticsController.qrLocations);
router.get("/qr/:id/recent", validate(idParamSchema), analyticsController.qrRecentScans);
router.get("/qr/:id/geo", validate(idParamSchema), analyticsController.qrGeoReport);
// Live "today" count for a single QR — same reasoning as /summary's
// scansToday: don't trust the denormalized field on the QRCode doc.
router.get("/qr/:id/today", validate(idParamSchema), analyticsController.qrScansToday);

export default router;