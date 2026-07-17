import { Router } from "express";
// Swap this import for whatever your existing auth middleware is actually called/exported as.
import { authenticate } from "../middlewares/auth.middleware";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  removeNotification,
} from "../controllers/Notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);
router.delete("/:id", removeNotification);

export default router;