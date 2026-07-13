import { Schema, model, Document, Types } from "mongoose";

export enum NotificationType {
  SCAN = "scan",
  CLICK = "click",
  LIMIT_WARNING = "limit_warning",
  SUBSCRIPTION = "subscription",
  SYSTEM = "system",
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // e.g. { qrCodeId, scanId, planId }
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);