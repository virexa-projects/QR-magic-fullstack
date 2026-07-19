// lib/primaryAction.ts
import type { QRType } from "../types";
import { getMapsHref } from "./location";

export interface PrimaryAction {
  label: string;
  href: string;
  external?: boolean;
  isVCard?: boolean;
  isICS?: boolean;
}

export function getPrimaryAction(type: QRType, data: Record<string, any>): PrimaryAction | null {
  switch (type) {
    case "url":
      return { label: "Visit site", href: data.url || "#", external: true };
    case "location":
      return { label: "Get directions", href: getMapsHref(data), external: true };
    case "phone":
      return { label: "Call now", href: `tel:${data.phone || ""}` };
    case "sms":
      return { label: "Send message", href: `sms:${data.phone || ""}` };
    case "email":
      return { label: "Send email", href: `mailto:${data.email || ""}` };
    case "whatsapp":
      return { label: "Open WhatsApp", href: `https://wa.me/${(data.phone || "").replace(/\D/g, "")}`, external: true };
    // case "vcard":
     
    //   return { label: "Add to Contacts", href: "#", isVCard: true };
    case "event":
      // href unused for event — handled via downloadICS in the click handler
      return { label: "Add to Calendar", href: "#", isICS: true };
    default:
      return null;
  }
}
