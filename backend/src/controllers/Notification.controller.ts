import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/Notification.service";

// Adjust this to match however your `protect`/`authenticate` middleware
// attaches the logged-in user (req.user.id, req.user._id, req.userId, ...).
function getUserId(req: Request): string {
  return (req as any).user?.id || (req as any).user?._id?.toString();
}

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await notificationService.listNotifications(userId, page, limit, unreadOnly);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const notification = await notificationService.markAsRead(userId, req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function removeNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const deleted = await notificationService.deleteNotification(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}