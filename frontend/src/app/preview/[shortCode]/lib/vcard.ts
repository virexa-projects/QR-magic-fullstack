// lib/vcard.ts
import { trackClickBeacon } from "./tracking";

function escapeVCardValue(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVCardString(data: Record<string, any>): string {
  const { fullName = "", role = "", company = "", phones = [], emails = [], socials = [] } = data;

  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  if (fullName) {
    lines.push(`FN:${escapeVCardValue(fullName)}`);
    const parts = fullName.trim().split(/\s+/);
    const last = parts.length > 1 ? parts.pop() : "";
    const first = parts.join(" ");
    lines.push(`N:${escapeVCardValue(last || "")};${escapeVCardValue(first || fullName)};;;`);
  }
  if (company) lines.push(`ORG:${escapeVCardValue(company)}`);
  if (role) lines.push(`TITLE:${escapeVCardValue(role)}`);

  phones.forEach((p: { label?: string; value: string }) => {
    if (!p?.value) return;
    const type = (p.label || "CELL").toUpperCase().replace(/[^A-Z]/g, "") || "CELL";
    lines.push(`TEL;TYPE=${type},VOICE:${escapeVCardValue(p.value)}`);
  });

  emails.forEach((e: { label?: string; value: string }) => {
    if (!e?.value) return;
    const type = (e.label || "HOME").toUpperCase().replace(/[^A-Z]/g, "") || "HOME";
    lines.push(`EMAIL;TYPE=${type}:${escapeVCardValue(e.value)}`);
  });

  socials.forEach((s: { label?: string; value: string }) => {
    if (!s?.value) return;
    const url = /^https?:\/\//i.test(s.value) ? s.value : `https://${s.value}`;
    lines.push(`URL;TYPE=${escapeVCardValue(s.label || "Website")}:${escapeVCardValue(url)}`);
  });

  lines.push("END:VCARD");
  // vCard spec requires CRLF line endings
  return lines.join("\r\n");
}

export function downloadVCard(shortCode: string, data: Record<string, any>) {
  trackClickBeacon(shortCode);

  const vcf = buildVCardString(data);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const filename = `${(data.fullName || "contact").trim().replace(/\s+/g, "_")}.vcf`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // give the browser a tick to actually start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
