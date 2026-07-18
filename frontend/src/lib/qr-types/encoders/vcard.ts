// lib/qr-types/encoders/vcard.ts
import type { VCardValue } from "../schema";

/** Builds a VCARD 3.0 payload from the rich vCard form value. */
export function encodeVCard(v: VCardValue): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${v.fullName || ""}`,
    `TITLE:${v.role || ""}`,
    `ORG:${v.company || ""}`,
    ...(v.bio ? [`NOTE:${v.bio.replace(/\n/g, "\\n")}`] : []),
    ...v.phones.map((p) => `TEL;TYPE=${(p.label || "CELL").toUpperCase()}:${p.value}`),
    ...v.emails.map((e) => `EMAIL;TYPE=${(e.label || "WORK").toUpperCase()}:${e.value}`),
    ...v.socials.map((s) => `URL;TYPE=${(s.label || "URL").toUpperCase()}:${s.value}`),
    "END:VCARD",
  ];
  return lines.join("\n");
}
