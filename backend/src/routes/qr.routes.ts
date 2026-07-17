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
import { uploadLogo } from "@middlewares/upload.middleware";
import { attachLogo } from "@middlewares/attachLogo.middleware";

const router = Router();

// Public — hit directly by scanning phones, no auth.
// This is the route now encoded into every printed QR image.
router.get("/r/:shortCode", qrController.redirectByShortCode);

// Public — legacy JSON lookup + click tracking, kept for compatibility
router.get("/short/:shortCode", qrController.getByShortCode);
router.post("/short/:shortCode/click", qrController.trackClick);

router.use(authenticate);

router.post("/", enforceQrQuota, validate(createQrSchema), qrController.create);
router.get("/", validate(listQrSchema), qrController.list);
router.get("/:id", validate(idParamSchema), qrController.getOne);
router.patch(
  "/:id",
  uploadLogo.single("logo"),
  attachLogo,
  validate(updateQrSchema),
  qrController.update
);
router.delete("/:id", validate(idParamSchema), qrController.remove);

export default router;