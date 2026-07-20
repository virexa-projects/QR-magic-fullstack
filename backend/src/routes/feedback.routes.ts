import { Router } from "express";
import * as feedbackController from "@controllers/feedback.controller";
import { authenticate } from "@middlewares/auth.middleware"; // adjust to your actual auth middleware name

const router = Router();

// Public — hit from the preview page's feedback form submit button
router.post("/:shortCode/submit", feedbackController.submit);

// Owner-only — dashboard analytics for a feedback QR
router.get("/:qrId/responses", authenticate, feedbackController.list);
router.get("/:qrId/summary", authenticate, feedbackController.summary);

export default router;