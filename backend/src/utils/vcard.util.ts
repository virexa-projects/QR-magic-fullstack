function escapeVCardValue(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Server-side mirror of the frontend's buildVCardString (PreviewPage.tsx),
 * so the auto-redirect route can stream a .vcf without needing the
 * browser to render anything first.
 */
export function buildVCardString(data: Record<string, any>): string {
  const {
    fullName = "",
    role = "",
    company = "",
    phones = [],
    emails = [],
    socials = [],
  } = data;

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

  (phones as { label?: string; value: string }[]).forEach((p) => {
    if (!p?.value) return;
    const type = (p.label || "CELL").toUpperCase().replace(/[^A-Z]/g, "") || "CELL";
    lines.push(`TEL;TYPE=${type},VOICE:${escapeVCardValue(p.value)}`);
  });

  (emails as { label?: string; value: string }[]).forEach((e) => {
    if (!e?.value) return;
    const type = (e.label || "HOME").toUpperCase().replace(/[^A-Z]/g, "") || "HOME";
    lines.push(`EMAIL;TYPE=${type}:${escapeVCardValue(e.value)}`);
  });

  (socials as { label?: string; value: string }[]).forEach((s) => {
    if (!s?.value) return;
    const url = /^https?:\/\//i.test(s.value) ? s.value : `https://${s.value}`;
    lines.push(`URL;TYPE=${escapeVCardValue(s.label || "Website")}:${escapeVCardValue(url)}`);
  });

  lines.push("END:VCARD");
  return lines.join("\r\n");
}