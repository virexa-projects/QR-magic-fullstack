// components/dashboard-pages/codes/codes.utils.ts
import type { QrCode, QrType } from "./codes.types";

// --- Type-aware destination <-> friendly-fields conversion ----------------
// Mirrors the same encoding logic used in the Create flow (getQRValue),
// but in reverse: given a QrCode, produce the plain values a person
// actually wants to see and edit ("9944943242" not "tel:9944943242").
// content is the preferred source (already structured per type); we only
// fall back to parsing the destination string for older docs saved
// before content existed.
export function getEditableFields(q: QrCode): Record<string, string> {
  if (q.content && Object.keys(q.content).length > 0) {
    // content stores primitives per type already — stringify anything
    // that isn't (e.g. vcard's phones/emails/socials arrays) so it's
    // safe to bind to a plain text input if needed.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(q.content)) {
      out[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    return out;
  }

  // Fallback: parse the raw destination string for legacy docs with no content
  const d = q.destination;
  switch (q.type) {
    case "url":
      return { url: d };
    case "text":
      return { text: d };
    case "phone":
      return { phone: d.replace(/^tel:/, "") };
    case "whatsapp": {
      const m = d.match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/);
      return { phone: m?.[1] ?? "", message: m?.[2] ? decodeURIComponent(m[2]) : "" };
    }
    case "sms": {
      const m = d.match(/^sms:([^?]*)\??(?:body=(.*))?$/);
      return { phone: m?.[1] ?? "", message: m?.[2] ? decodeURIComponent(m[2]) : "" };
    }
    case "email": {
      const m = d.match(/^mailto:([^?]*)\??(?:subject=([^&]*))?&?(?:body=(.*))?$/);
      return {
        email: m?.[1] ?? "",
        subject: m?.[2] ? decodeURIComponent(m[2]) : "",
        body: m?.[3] ? decodeURIComponent(m[3]) : "",
      };
    }
    case "wifi": {
      const m = d.match(/^WIFI:T:([^;]*);S:([^;]*);P:([^;]*);;$/);
      return { encryption: m?.[1] ?? "WPA", ssid: m?.[2] ?? "", password: m?.[3] ?? "" };
    }
    case "location": {
      const m = d.match(/^geo:([^,]*),(.*)$/);
      return { latitude: m?.[1] ?? "", longitude: m?.[2] ?? "" };
    }
    default:
      return {};
  }
}

// Reverse direction: friendly field values -> the raw destination string
// your QR scanner / phone actually needs to act on.
export function buildDestination(type: QrType, fields: Record<string, string>): string {
  switch (type) {
    case "url":
      return fields.url || "https://example.com";
    case "text":
      return fields.text || "";
    case "phone":
      return `tel:${fields.phone || ""}`;
    case "whatsapp": {
      const phone = (fields.phone || "").replace(/\D/g, "");
      const msg = fields.message ? `?text=${encodeURIComponent(fields.message)}` : "";
      return `https://wa.me/${phone}${msg}`;
    }
    case "sms":
      return `sms:${fields.phone || ""}?body=${encodeURIComponent(fields.message || "")}`;
    case "email":
      return `mailto:${fields.email || ""}?subject=${encodeURIComponent(fields.subject || "")}&body=${encodeURIComponent(fields.body || "")}`;
    case "wifi":
      return `WIFI:T:${fields.encryption || "WPA"};S:${fields.ssid || ""};P:${fields.password || ""};;`;
    case "location":
      return `geo:${fields.latitude || "0"},${fields.longitude || "0"}`;
    case "vcard": {
      // vCard has too many nested fields (phones/emails/socials arrays) for
      // a quick inline edit — full editing happens via the Design/Create
      // flow. We still allow editing the top-level name/role/company here.
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${fields.fullName || ""}`, `TITLE:${fields.role || ""}`, `ORG:${fields.company || ""}`];
      try {
        const phones = fields.phones ? JSON.parse(fields.phones) : [];
        const emails = fields.emails ? JSON.parse(fields.emails) : [];
        const socials = fields.socials ? JSON.parse(fields.socials) : [];
        phones.forEach((p: any) => lines.push(`TEL;TYPE=${(p.label || "CELL").toUpperCase()}:${p.value}`));
        emails.forEach((e: any) => lines.push(`EMAIL;TYPE=${(e.label || "WORK").toUpperCase()}:${e.value}`));
        socials.forEach((s: any) => lines.push(`URL;TYPE=${(s.label || "URL").toUpperCase()}:${s.value}`));
      } catch {
        /* ignore malformed JSON, keep name/role/company only */
      }
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    default:
      return fields.destination || "";
  }
}

export function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN");
}

export function slugifyFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "qrcode";
}
