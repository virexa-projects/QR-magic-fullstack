import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { analyticsRangeSchema } from "@validators/analytics.validator";
import { idParamSchema } from "@validators/qr.validator";
import * as analyticsController from "@controllers/analytics.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", analyticsController.summary);
router.get("/trend", validate(analyticsRangeSchema), analyticsController.trend);
router.get("/devices", validate(analyticsRangeSchema), analyticsController.devices);
router.get("/locations", analyticsController.locations);
router.get("/hourly", validate(analyticsRangeSchema), analyticsController.hourly);
router.get("/qr/:id", validate(idParamSchema), analyticsController.qrAnalytics);

export default router;
