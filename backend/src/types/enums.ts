export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}

export enum QRType {
  URL = "url",
  TEXT = "text",
  WHATSAPP = "whatsapp",
  WIFI = "wifi",
  VCARD = "vcard",
  UPI = "upi",
  EMAIL = "email",
  PHONE = "phone",
  SMS = "sms",
  LOCATION = "location",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  SOCIAL = "social",
  EVENT = "event",
  FEEDBACK = "feedback",
  MENU = "menu",
  PLAYLIST = "playlist",
}

export enum QRStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  EXPIRED = "expired",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  SCHEDULED = "scheduled",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

export enum DeviceType {
  ANDROID = "Android",
  IOS = "iOS",
  DESKTOP = "Desktop",
  OTHER = "Other",
}