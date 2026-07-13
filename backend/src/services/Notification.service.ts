import { Types } from "mongoose";
import { Notification, NotificationType, INotification } from "../models/Notification.model";
import { getIO, userRoom } from "../sockets/io";

interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

function qrRoom(qrId: string) {
  return `qr:${qrId}`;
}

/**
 * Creates a notification doc AND pushes it in real time:
 *  - always to the user's personal room ("user:<id>") → powers the bell
 *  - additionally to "qr:<qrCodeId>" when data.qrCodeId is set → powers a
 *    live scan/click counter on the QR detail page for anyone with that
 *    page open (your socket.ts already lets clients join this room via
 *    the "qr:watch" event, it just wasn't being used yet).
 */
export async function createNotification(input: CreateNotificationInput): Promise<INotification> {
  const notification = await Notification.create({
    user: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data || {},
  });

  try {
    const io = getIO();
    io.to(userRoom(String(input.userId))).emit("notification:new", notification.toJSON());

    if (input.data?.qrCodeId) {
      io.to(qrRoom(String(input.data.qrCodeId))).emit("qr:activity", {
        type: input.type,
        qrCodeId: input.data.qrCodeId,
        message: input.message,
        createdAt: notification.createdAt,
      });
    }
  } catch {
    // Socket.IO not initialized (tests/scripts) — notification is still persisted.
  }

  return notification;
}

// --- Convenience wrappers for common events ---

export async function notifyScan(userId: string, qrCodeId: string, qrCodeName: string) {
  return createNotification({
    userId,
    type: NotificationType.SCAN,
    title: "New scan",
    message: `Your QR code "${qrCodeName}" was just scanned.`,
    data: { qrCodeId },
  });
}

export async function notifyClick(userId: string, qrCodeId: string, qrCodeName: string) {
  return createNotification({
    userId,
    type: NotificationType.CLICK,
    title: "New click",
    message: `Someone tapped the CTA on "${qrCodeName}".`,
    data: { qrCodeId },
  });
}

export async function notifyLimitWarning(userId: string, message: string) {
  return createNotification({
    userId,
    type: NotificationType.LIMIT_WARNING,
    title: "Plan limit warning",
    message,
  });
}

// --- Query/mutation helpers used by the controller ---

export async function listNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
  const filter: Record<string, any> = { user: userId };
  if (unreadOnly) filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { items, total, page, limit, unreadCount };
}

export async function markAsRead(userId: string, notificationId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
}

export async function markAllAsRead(userId: string) {
  return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}

export async function deleteNotification(userId: string, notificationId: string) {
  return Notification.findOneAndDelete({ _id: notificationId, user: userId });
}

export async function getUnreadCount(userId: string) {
  return Notification.countDocuments({ user: userId, isRead: false });
}