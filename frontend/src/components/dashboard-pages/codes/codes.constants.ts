// components/dashboard-pages/codes/codes.constants.ts
import type { QrType, QRDesign } from "./codes.types";
import type { FieldConfigItem } from "./codes.types";

export const typeColors: Record<string, string> = {
  url: "bg-primary-soft text-primary",
  text: "bg-secondary text-foreground",
  whatsapp: "bg-success/10 text-success",
  wifi: "bg-warning/10 text-warning",
  vcard: "bg-accent text-accent-foreground",
  email: "bg-primary-soft text-primary",
  phone: "bg-success/10 text-success",
  sms: "bg-warning/10 text-warning",
  location: "bg-accent text-accent-foreground",
  image: "bg-primary-soft text-primary",
};

export const defaultDesign: QRDesign = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  dotStyle: "square",
  frame: "none",
};

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Friendly field metadata per type — label, placeholder, input type.
// Drives which inputs the edit dialog renders for a given QR type.
// Partial: types with no quick-edit fields (e.g. vcard's nested arrays,
// media/gallery types) simply resolve to `undefined` — always read this
// with a `FIELD_CONFIG[type] ?? []` fallback.
export const FIELD_CONFIG: Partial<Record<QrType, FieldConfigItem[]>> = {
  url: [{ key: "url", label: "Website URL", placeholder: "https://yourwebsite.com", type: "url" }],
  text: [{ key: "text", label: "Text content", placeholder: "Enter text…", multiline: true }],
  phone: [{ key: "phone", label: "Phone number", placeholder: "9944943242", type: "tel" }],
  whatsapp: [
    { key: "phone", label: "Phone (with country code)", placeholder: "919944943242", type: "tel" },
    { key: "message", label: "Pre-filled message", placeholder: "Hi! Found you via QR" },
  ],
  sms: [
    { key: "phone", label: "Phone number", placeholder: "9944943242", type: "tel" },
    { key: "message", label: "Message", placeholder: "Your message…" },
  ],
  email: [
    { key: "email", label: "Email address", placeholder: "hello@example.com", type: "email" },
    { key: "subject", label: "Subject", placeholder: "Subject" },
    { key: "body", label: "Message", placeholder: "Your message…", multiline: true },
  ],
  wifi: [
    { key: "ssid", label: "Network name (SSID)", placeholder: "MyWiFi" },
    { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
  ],
  location: [
    { key: "latitude", label: "Latitude", placeholder: "28.6139" },
    { key: "longitude", label: "Longitude", placeholder: "77.2090" },
  ],
  vcard: [
    { key: "fullName", label: "Full name", placeholder: "Rahul Sharma" },
    { key: "role", label: "Job title / role", placeholder: "Marketing Manager" },
    { key: "company", label: "Company", placeholder: "Your Company" },
  ],
  // Gallery / media types (image, video, audio, etc.) don't have a quick
  // inline edit — handled via the full Create/Design flow instead.
};
