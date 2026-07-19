// types.ts
export type QRType =
  | "url"
  | "text"
  | "whatsapp"
  | "upi"
  | "wifi"
  | "vcard"
  | "email"
  | "phone"
  | "sms"
  | "location"
  | "image"
  | "video"
  | "audio"
  | "social"
  | "event"
  | "feedback"
  | "menu"
  | "playlist";

export interface QrDesign {
  fgColor?: string;
  bgColor?: string;
  eyeColor?: string;
  bannerColor?: string;
  accentColor?: string;
}

export interface ContentProps {
  data: Record<string, any>;
  shortCode: string;
}
