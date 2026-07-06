import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import qrRoutes from "./qr.routes";
import analyticsRoutes from "./analytics.routes";
import billingRoutes from "./billing.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "OK", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/qr", qrRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/billing", billingRoutes);
router.use("/admin", adminRoutes);

export default router;
