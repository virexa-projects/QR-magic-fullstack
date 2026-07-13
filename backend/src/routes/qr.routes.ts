import { Router } from "express";
import { validate } from "@middlewares/validate.middleware";
import { authenticate } from "@middlewares/auth.middleware";
import { enforceQrQuota } from "@middlewares/planLimit.middleware";
import * as qrController from "@controllers/qr.controller";
import {
  createQrSchema,
  updateQrSchema,
  idParamSchema,
  listQrSchema,
} from "@validators/qr.validator";

const router = Router();
// Public — hit by anonymous visitors' phones/browsers, no auth
router.get("/short/:shortCode", qrController.getByShortCode);
router.post("/short/:shortCode/click", qrController.trackClick); // NEW

router.use(authenticate);

router.post("/", enforceQrQuota, validate(createQrSchema), qrController.create);
router.get("/", validate(listQrSchema), qrController.list);
router.get("/:id", validate(idParamSchema), qrController.getOne);
router.patch("/:id", validate(updateQrSchema), qrController.update);
router.delete("/:id", validate(idParamSchema), qrController.remove);

export default router;
