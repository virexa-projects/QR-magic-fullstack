import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { createSubscriptionSchema } from "@validators/analytics.validator";
import * as billingController from "@controllers/billing.controller";

const router = Router();

router.get("/plans", billingController.plans);

router.use(authenticate);
router.post("/subscribe", validate(createSubscriptionSchema), billingController.subscribe);
router.get("/history", billingController.history);
router.get("/active", billingController.active);
router.post("/cancel/:id", billingController.cancel);

export default router;
