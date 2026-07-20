import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import qrRoutes from "./qr.routes";
import analyticsRoutes from "./analytics.routes";
import billingRoutes from "./billing.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from './Notification.routes'
import searchRoutes from './Search.routes';
import CloudinaryRoute from './upload.routes';
import feedbackRoutes from "./feedback.routes"
const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "OK", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/qr", qrRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/billing", billingRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);
router.use("/admin", adminRoutes);
router.use("/cloudinary", CloudinaryRoute);
router.use("/feedback", feedbackRoutes);

export default router;
