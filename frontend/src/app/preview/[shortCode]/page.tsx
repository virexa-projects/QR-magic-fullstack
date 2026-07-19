"use client";
// \src\app\preview\[shortCode]\page.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, User, CreditCard, MessageSquare, Wifi,
  Mail, Phone, MapPin, FileText, MessageCircle,
  ExternalLink, Lock, Link2, ShieldCheck, ArrowRight,
  Star, CalendarPlus, Clock, Users, UtensilsCrossed,
} from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaXTwitter, FaYoutube, FaGithub, FaFacebookF, FaTiktok } from "react-icons/fa6";
import { fetchQrByShortCode } from "@/store/slices/qrSlice";
import type { AppDispatch, RootState } from "@/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type QRType =
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

interface QrDesign {
  fgColor?: string;
  bgColor?: string;
  eyeColor?: string;
  bannerColor?: string;
  accentColor?: string;
}

interface PageProps {
  params: Promise<{ shortCode: string }>;
}

/* ------------------------------------------------------------------ */
/*  Shared icon map                                                    */
/* ------------------------------------------------------------------ */

const SOCIAL_ICONS: Record<string, { icon: React.ElementType; brand: string }> = {
  LinkedIn: { icon: FaLinkedinIn, brand: "#0A66C2" },
  Instagram: { icon: FaInstagram, brand: "#E4405F" },
  X: { icon: FaXTwitter, brand: "#000000" },
  YouTube: { icon: FaYoutube, brand: "#FF0000" },
  Facebook: { icon: FaFacebookF, brand: "#1877F2" },
  TikTok: { icon: FaTiktok, brand: "#000000" },
  GitHub: { icon: FaGithub, brand: "#181717" },
  WhatsApp: { icon: MessageCircle, brand: "#25D366" },
  Website: { icon: Globe, brand: "#1a1a2e" },
  Custom: { icon: Link2, brand: "#475569" },
};

function socialMeta(label: string) {
  return SOCIAL_ICONS[label] || SOCIAL_ICONS.Custom;
}

/* ------------------------------------------------------------------ */
/*  Click tracking                                                     */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function trackClickBeacon(shortCode: string) {
  try {
    navigator.sendBeacon(`${API_BASE}/qr/short/${shortCode}/click`);
  } catch {
    // sendBeacon unsupported in some old webviews — don't block on it
  }
}

function trackAndGo(shortCode: string, href: string, external?: boolean) {
  trackClickBeacon(shortCode);
  if (external) window.open(href, "_blank", "noreferrer");
  else window.location.href = href;
}

/* ------------------------------------------------------------------ */
/*  vCard (.vcf) generation                                             */
/* ------------------------------------------------------------------ */

function escapeVCardValue(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildVCardString(data: Record<string, any>): string {
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

function downloadVCard(shortCode: string, data: Record<string, any>) {
  // record the click same as every other CTA on this page
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

/* ------------------------------------------------------------------ */
/*  Event (.ics) generation                                            */
/* ------------------------------------------------------------------ */

function escapeICSValue(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDateTime(date: string, time?: string): string {
  const d = (date || "").replace(/-/g, "");
  if (!time) return d;
  const t = time.replace(":", "") + "00";
  return `${d}T${t}`;
}

function reminderToTrigger(reminder?: string): string | null {
  if (!reminder || reminder === "none") return null;
  const m = reminder.match(/(\d+)\s*(min|hour|day)/i);
  if (!m) return "-PT15M";
  const [, n, unit] = m;
  if (unit.startsWith("min")) return `-PT${n}M`;
  if (unit.startsWith("hour")) return `-PT${n}H`;
  return `-P${n}D`;
}

function buildICSString(data: Record<string, any>): string {
  const {
    title = "Event",
    description = "",
    location = "",
    startDate = "",
    startTime = "",
    endDate = "",
    endTime = "",
    allDay = false,
    reminder = "",
    organizerName = "",
  } = data;

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT"];
  lines.push(`SUMMARY:${escapeICSValue(title)}`);
  if (description) lines.push(`DESCRIPTION:${escapeICSValue(description)}`);
  if (location) lines.push(`LOCATION:${escapeICSValue(location)}`);
  if (organizerName) lines.push(`ORGANIZER;CN=${escapeICSValue(organizerName)}:MAILTO:noreply@example.com`);

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDateTime(startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDateTime(endDate || startDate)}`);
  } else {
    lines.push(`DTSTART:${icsDateTime(startDate, startTime || "00:00")}`);
    lines.push(`DTEND:${icsDateTime(endDate || startDate, endTime || startTime || "00:00")}`);
  }

  const trigger = reminderToTrigger(reminder);
  if (trigger) {
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:${trigger}`, "END:VALARM");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(shortCode: string, data: Record<string, any>) {
  trackClickBeacon(shortCode);
  const ics = buildICSString(data);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const filename = `${(data.title || "event").trim().replace(/\s+/g, "_")}.ics`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ------------------------------------------------------------------ */
/*  Location helpers                                                   */
/* ------------------------------------------------------------------ */

function getMapsHref(data: Record<string, any>): string {
  if (data.mode === "url" && data.mapsUrl) return data.mapsUrl;
  const lat = data.latitude || "28.6139";
  const lng = data.longitude || "77.2090";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function PreviewPage({ params }: PageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentShortQr, loading, error } = useSelector(
    (state: RootState) => state.qr
  );
  const [justArrived, setJustArrived] = useState(true);

  useEffect(() => {
    const loadQr = async () => {
      const { shortCode } = await params;
      if (shortCode) dispatch(fetchQrByShortCode(shortCode));
    };
    loadQr();
    const t = setTimeout(() => setJustArrived(false), 900);
    return () => clearTimeout(t);
  }, [dispatch, params]);

  if (loading) return <StateScreen kind="loading" />;
  if (error) return <StateScreen kind="error" message={error} />;
  if (!currentShortQr) return <StateScreen kind="missing" />;

  const design: QrDesign = currentShortQr.design || {};
  const content = currentShortQr.content || {};
  const type = currentShortQr.type as QRType;
  const shortCode = currentShortQr.shortCode as string;

  // vCard theming lives on content.theme; other types fall back to design/fgColor.
  const accent =
    (type === "vcard" && content?.theme?.accentColor) ||
    design.accentColor ||
    design.fgColor ||
    "#0d9488";

  const primaryAction = getPrimaryAction(type, content);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#FAFAF8] text-[#14151A]"
      style={{ ["--accent" as string]: accent }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.14] blur-3xl"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}, transparent)` }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-8 sm:max-w-lg sm:px-6 sm:pt-14 lg:max-w-xl">
        <div className="mb-5 flex justify-center sm:mb-7">
          <ScanPulse accent={accent} active={justArrived} />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent(type, content, design, shortCode)}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-5 text-center text-[12px] text-neutral-400 sm:mt-6">
          Shared by <span className="font-medium text-neutral-500">{currentShortQr.name || "a Virexa user"}</span>
        </p>

        <div className="mt-auto" />

        <BrandFooter accent={accent} />
      </div>

      {primaryAction && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 p-3 backdrop-blur sm:hidden">
          <button
            onClick={() => {
              if (primaryAction.isVCard) {
                downloadVCard(shortCode, content);
              } else if (primaryAction.isICS) {
                downloadICS(shortCode, content);
              } else {
                trackAndGo(shortCode, primaryAction.href, primaryAction.external);
              }
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {primaryAction.label} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Entry animation — one pulse, then it rests                         */
/* ------------------------------------------------------------------ */

function ScanPulse({ accent, active }: { accent: string; active: boolean }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      {active && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ opacity: 0.35, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ opacity: 0.25, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </>
      )}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
        style={{ backgroundColor: `${accent}1f` }}
      >
        <ShieldCheck className="h-6 w-6" style={{ color: accent }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading / error / missing states                                   */
/* ------------------------------------------------------------------ */

function StateScreen({ kind, message }: { kind: "loading" | "error" | "missing"; message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6">
      <div className="text-center">
        {kind === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Loading…</p>
          </>
        )}
        {kind === "error" && (
          <>
            <p className="text-sm font-semibold text-neutral-800">Something went wrong</p>
            <p className="mt-1 text-xs text-neutral-500">{message}</p>
          </>
        )}
        {kind === "missing" && (
          <>
            <p className="text-sm font-semibold text-neutral-800">This code isn't available</p>
            <p className="mt-1 text-xs text-neutral-500">It may have expired or been removed.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Branded footer — the growth loop                                   */
/* ------------------------------------------------------------------ */

function BrandFooter({ accent }: { accent: string }) {
  return (
    <div className="mt-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:mt-10">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a` }}>
          <span className="text-[11px] font-bold" style={{ color: accent }}>V</span>
        </div>
        <span className="text-[12px] text-neutral-500">Made with <span className="font-semibold text-neutral-700">Virexa</span></span>
      </div>
      <a
        href="/"
        className="flex items-center gap-1 text-[12px] font-semibold"
        style={{ color: accent }}
      >
        Create yours <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Primary action resolver (for the sticky mobile bar)                */
/* ------------------------------------------------------------------ */

function getPrimaryAction(
  type: QRType,
  data: Record<string, any>
): { label: string; href: string; external?: boolean; isVCard?: boolean; isICS?: boolean } | null {
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
    case "vcard":
      // href unused for vcard — handled via downloadVCard in the click handler
      return { label: "Add to Contacts", href: "#", isVCard: true };
    case "event":
      // href unused for event — handled via downloadICS in the click handler
      return { label: "Add to Calendar", href: "#", isICS: true };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Content router                                                     */
/* ------------------------------------------------------------------ */

function renderContent(
  type: QRType,
  data: Record<string, any>,
  design: QrDesign,
  shortCode: string
) {
  switch (type) {
    case "url":
      return <URLContent data={data} shortCode={shortCode} />;

    case "vcard":
      return <VCardContent data={data} design={design} shortCode={shortCode} />;

    case "upi":
      return <UPIContent data={data} shortCode={shortCode} />;

    case "whatsapp":
      return <WhatsAppContent data={data} shortCode={shortCode} />;

    case "wifi":
      return <WifiContent data={data} shortCode={shortCode} />;

    case "email":
      return <EmailContent data={data} shortCode={shortCode} />;

    case "phone":
      return <PhoneCallContent data={data} shortCode={shortCode} />;

    case "sms":
      return <SMSContent data={data} shortCode={shortCode} />;

    case "location":
      return <LocationContent data={data} shortCode={shortCode} />;

    case "text":
      return <TextContent data={data} />;

    case "image":
      return <ImageContent data={data} />;

    case "video":
      return <VideoContent data={data} />;

    case "audio":
      return <AudioContent data={data} />;

    case "social":
      return <SocialContent data={data} />;

    case "event":
      return <EventContent data={data} shortCode={shortCode} />;

    case "feedback":
      return <FeedbackContent data={data} shortCode={shortCode} />;

    case "menu":
      return <MenuContent data={data} />;

    case "playlist":
      return <PlaylistContent data={data} />;

    default:
      return (
        <div className="p-10 text-center">
          Unsupported QR Type
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  URL                                                                 */
/* ------------------------------------------------------------------ */

function URLContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const url = data.url || "https://yourwebsite.com";
  const domain = url.replace(/https?:\/\//, "").split("/")[0] || "yourwebsite.com";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-2.5 sm:px-7">
        <Lock className="h-3.5 w-3.5 text-neutral-400" />
        <p className="truncate text-xs text-neutral-500">{domain}</p>
      </div>
      <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
          <Globe className="h-8 w-8 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{domain}</h2>
        <p className="mt-1.5 max-w-xs text-[13px] text-neutral-500">
          This QR code opens the link above. Tap below to continue.
        </p>
        <button
          onClick={() => trackAndGo(shortCode, url, true)}
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Visit site <ExternalLink className="h-4 w-4" />
        </button>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
          <ShieldCheck className="h-3 w-3" /> Scanned links are shown before you open them
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VCard — reads content.theme (bannerColor/accentColor/layout),      */
/*  content.avatarUrl, content.bio, content.showAddToContacts          */
/* ------------------------------------------------------------------ */

function VCardContent({
  data,
  design,
  shortCode,
}: {
  data: Record<string, any>;
  design: QrDesign;
  shortCode: string;
}) {
  const theme = data.theme || {};
  const layout = theme.layout || "classic";
  // theme.bannerColor can be a solid hex OR a CSS gradient string — always
  // apply it with `background`, never `backgroundColor`.
  const banner = theme.bannerColor || design.bannerColor || "#000099";
  const accent = theme.accentColor || design.accentColor || design.fgColor || "#0d9488";

  const name = data.fullName || "Your Name";
  const role = data.role || (data.company ? "Team Member" : "Your Role");
  const company = data.company || "";
  const bio = data.bio || "";
  const avatarUrl = data.avatarUrl || "";
  const initials = name.split(/\s+/).filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const phones: { label: string; value: string }[] = data.phones || [];
  const emails: { label: string; value: string }[] = data.emails || [];
  const socials: { label: string; value: string }[] = data.socials || [];
  const showCTA = data.showAddToContacts !== false;
  const hasContactInfo = phones.length > 0 || emails.length > 0 || socials.length > 0;

  const AvatarCircle = ({ size }: { size: number }) => (
    <div
      className="shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full" style={{ backgroundColor: `${accent}26` }}>
          <span className="font-bold" style={{ color: accent, fontSize: size * 0.32 }}>{initials}</span>
        </div>
      )}
    </div>
  );

  const SocialStrip = () =>
    socials.length ? (
      <div className="flex flex-wrap justify-center gap-2 px-4">
        {socials.map((s, i) => {
          const meta = socialMeta(s.label);
          return (
            <a
              key={i}
              href={/^https?:\/\//i.test(s.value) ? s.value : `https://${s.value}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClickBeacon(shortCode)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: `${meta.brand}1a` }}
              title={s.label}
            >
              <meta.icon className="h-3.5 w-3.5" style={{ color: meta.brand }} />
            </a>
          );
        })}
      </div>
    ) : null;

  const ContactRows = () => (
    <div className="space-y-2">
      {phones.map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
      {emails.map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
      {!hasContactInfo && (
        <p className="py-6 text-center text-xs text-neutral-400">No contact details added yet.</p>
      )}
    </div>
  );

  const CTA = () =>
    showCTA ? (
      <div className="px-4 pb-5 sm:px-8">
        <button
          onClick={() => downloadVCard(shortCode, data)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white"
        >
          <User className="h-4 w-4" /> Add to Contacts
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-400">Saves directly to your phone — no app needed</p>
      </div>
    ) : null;

  // --- Split layout: thin bar, left-aligned avatar + name row ---
  if (layout === "split") {
    return (
      <div className="flex flex-col">
        <div className="h-2.5" style={{ background: banner }} />
        <div className="flex items-center gap-4 px-5 pb-4 pt-5 sm:px-8">
          <AvatarCircle size={64} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight text-neutral-900">{name}</h3>
            <p className="truncate text-xs text-neutral-500">{role}{company ? ` · ${company}` : ""}</p>
          </div>
        </div>
        {bio && <p className="px-5 pb-3 text-[13px] leading-relaxed text-neutral-600 sm:px-8">{bio}</p>}
        <div className="pb-3"><SocialStrip /></div>
        <div className="px-4 pb-4 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  // --- Minimal layout: no banner, centered & clean ---
  if (layout === "minimal") {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center px-4 pt-8">
          <AvatarCircle size={84} />
          <h3 className="mt-3 text-lg font-bold leading-tight text-neutral-900">{name}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">{role}</p>
          {company && <p className="text-[11px] text-neutral-400">{company}</p>}
          {bio && <p className="mt-2 max-w-xs text-center text-[13px] leading-relaxed text-neutral-600">{bio}</p>}
        </div>
        <div className="mt-4"><SocialStrip /></div>
        <div className="mx-5 my-4 h-px bg-neutral-100 sm:mx-8" />
        <div className="px-4 pb-4 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  // --- Banner layout: full-bleed color, name overlaid ---
  if (layout === "banner") {
    return (
      <div className="flex flex-col">
        <div className="flex items-start justify-between px-5 pb-9 pt-6 sm:px-8" style={{ background: banner }}>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight text-white">{name}</h3>
            <p className="mt-0.5 truncate text-xs text-white/80">{role}</p>
            {company && <p className="truncate text-[11px] text-white/70">{company}</p>}
          </div>
          <AvatarCircle size={56} />
        </div>
        {bio && <p className="px-5 pt-3 text-[13px] leading-relaxed text-neutral-600 sm:px-8">{bio}</p>}
        <div className="mt-3"><SocialStrip /></div>
        <div className="px-4 pb-4 pt-3 sm:px-8"><ContactRows /></div>
        <CTA />
      </div>
    );
  }

  // --- Classic layout (default): banner strip + centered avatar overlap ---
  return (
    <div className="flex flex-col">
      <div className="relative px-5 pb-14 pt-7 sm:px-8" style={{ background: banner }}>
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
          {company || "Digital Card"}
        </p>
      </div>
      <div className="relative -mt-11 flex justify-center sm:-mt-12">
        <AvatarCircle size={80} />
      </div>
      <div className="mt-3 px-4 text-center">
        <h3 className="text-lg font-bold leading-tight text-neutral-900 sm:text-xl">{name}</h3>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">{role}</p>
        {bio && <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-600">{bio}</p>}
      </div>
      <div className="mt-4"><SocialStrip /></div>
      <div className="mt-5 space-y-2 px-4 pb-4 sm:px-8"><ContactRows /></div>
      <CTA />
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={accent ? { backgroundColor: `${accent}14` } : undefined}>
        <Icon className="h-3.5 w-3.5" style={{ color: accent || "var(--accent)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="truncate text-[13px] font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  UPI                                                                 */
/* ------------------------------------------------------------------ */

function UPIContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const name = data.name || "Payee Name";
  const amount = data.amount || "0.00";
  const upiId = data.upiId || "";
  const upiHref = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(amount)}${data.note ? `&tn=${encodeURIComponent(data.note)}` : ""}`;

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <CreditCard className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <p className="mt-3 text-base font-semibold text-neutral-900 sm:text-lg">{name}</p>
      {upiId && <p className="mt-0.5 text-xs text-neutral-500">{upiId}</p>}

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Amount</p>
        <p className="mt-1 text-4xl font-bold text-neutral-900 sm:text-5xl">₹{amount}</p>
      </div>

      {data.note && (
        <p className="mt-3 rounded-full bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500">{data.note}</p>
      )}

      <button
        onClick={() => trackAndGo(shortCode, upiHref, false)}
        className="mt-7 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Pay ₹{amount}
      </button>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
        <ShieldCheck className="h-3 w-3" /> Paid directly to {name}, verified by UPI
      </p>
      <div className="mt-4 flex justify-center gap-6">
        {["GPay", "PhonePe", "Paytm"].map((app) => (
          <span key={app} className="text-[11px] text-neutral-400">{app}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WhatsApp                                                            */
/* ------------------------------------------------------------------ */

function WhatsAppContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Hi! 👋";
  const waHref = `https://wa.me/${phone.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <div className="flex flex-col bg-[#ece5dd]">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <User className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{phone}</p>
          <p className="text-[10px] text-white/70">online</p>
        </div>
      </div>
      <div className="flex min-h-[220px] flex-col justify-end px-4 py-6 sm:px-8">
        <div className="max-w-[85%] self-end sm:max-w-sm">
          <div className="rounded-lg rounded-tr-none bg-[#dcf8c6] px-3.5 py-2.5 shadow-sm">
            <p className="text-[13px] text-[#303030]">{message}</p>
            <p className="mt-1 text-right text-[9px] text-[#999]">9:41 AM</p>
          </div>
        </div>
      </div>
      <div className="bg-white px-4 py-4 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, waHref, true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#075e54] text-sm font-semibold text-white"
        >
          <MessageSquare className="h-4 w-4" /> Open WhatsApp
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wifi                                                                */
/* ------------------------------------------------------------------ */

function WifiContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const ssid = data.ssid || "Network Name";
  const enc = data.encryption || "WPA";
  const password = data.password || "";
  const wifiHref = `WIFI:T:${enc};S:${ssid};P:${password};;`;

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <Wifi className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">{ssid}</h2>
      <p className="mt-1 text-xs text-neutral-500">Secured with {enc}</p>

      <button
        onClick={() => trackAndGo(shortCode, wifiHref, false)}
        className="mt-7 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Join Network
      </button>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
        <Lock className="h-3 w-3" /> One tap — no typing the password
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Email                                                               */
/* ------------------------------------------------------------------ */

function EmailContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const email = data.email || "hello@example.com";
  const subject = data.subject || "Subject line";
  const body = data.body || "Your message here...";
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="flex flex-col">
      <div className="border-b border-neutral-100 px-5 py-3 sm:px-8">
        <p className="text-sm font-semibold text-neutral-900">New Message</p>
      </div>
      <div className="px-5 sm:px-8">
        <div className="flex items-center border-b border-neutral-100 py-2.5">
          <span className="w-12 text-xs text-neutral-400">To:</span>
          <span className="text-[13px] text-neutral-800">{email}</span>
        </div>
        <div className="flex items-center border-b border-neutral-100 py-2.5">
          <span className="w-12 text-xs text-neutral-400">Sub:</span>
          <span className="text-[13px] text-neutral-800">{subject}</span>
        </div>
      </div>
      <div className="px-5 py-4 sm:px-8">
        <p className="text-[13px] leading-relaxed text-neutral-600">{body}</p>
      </div>
      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, mailtoHref, false)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Mail className="h-4 w-4" /> Send Email
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phone / SMS                                                        */
/* ------------------------------------------------------------------ */

function PhoneCallContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-neutral-50 to-white px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm sm:h-24 sm:w-24">
        <User className="h-9 w-9 text-neutral-400 sm:h-11 sm:w-11" />
      </div>
      <p className="mt-4 text-xl font-semibold text-neutral-900 sm:text-2xl">{phone}</p>
      <p className="mt-1 text-xs text-neutral-500">Mobile</p>
      <div className="mt-8 flex w-full max-w-xs gap-3">
        <button
          onClick={() => trackAndGo(shortCode, `tel:${phone}`, false)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" /> Call
        </button>
        <button
          onClick={() => trackAndGo(shortCode, `sms:${phone}`, false)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <MessageCircle className="h-4 w-4" /> Message
        </button>
      </div>
    </div>
  );
}

function SMSContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Your message...";
  const smsHref = `sms:${phone}?body=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 border-b border-neutral-100 px-5 py-3 sm:px-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-4 w-4 text-neutral-400" />
        </div>
        <p className="text-sm font-semibold text-neutral-900">{phone}</p>
      </div>
      <div className="flex min-h-[180px] flex-col justify-end px-5 py-6 sm:px-8">
        <div className="max-w-[85%] self-end sm:max-w-sm">
          <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5" style={{ backgroundColor: "var(--accent)" }}>
            <p className="text-[13px] text-white">{message}</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, smsHref, false)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Location — handles both mode:"url" (mapsUrl) and lat/lng            */
/* ------------------------------------------------------------------ */

function LocationContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const isUrlMode = data.mode === "url" && data.mapsUrl;
  const mapsHref = getMapsHref(data);

  return (
    <div className="flex flex-col">
      <div className="relative flex items-center justify-center bg-[color:var(--accent)]/5" style={{ minHeight: 180 }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <MapPin className="h-12 w-12 text-red-500 drop-shadow-lg sm:h-14 sm:w-14" />
        </div>
      </div>
      <div className="px-5 py-5 text-center sm:px-8">
        <p className="text-sm font-semibold text-neutral-900">Pinned Location</p>
        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
          {isUrlMode ? mapsHref : `${data.latitude || "28.6139"}°N, ${data.longitude || "77.2090"}°E`}
        </p>
        <button
          onClick={() => trackAndGo(shortCode, mapsHref, true)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <MapPin className="h-4 w-4" /> Get Directions
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text                                                                */
/* ------------------------------------------------------------------ */

function TextContent({ data }: { data: Record<string, any> }) {
  const text = data.text || "Your text will appear here...";
  return (
    <div className="px-6 py-8 sm:px-8">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
        <FileText className="h-5 w-5" style={{ color: "var(--accent)" }} />
      </div>
      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-700">{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image / Video / Audio                                               */
/* ------------------------------------------------------------------ */

function ImageContent({ data }: { data: Record<string, any> }) {
  const image = data.image || data.imageUrl || data.url || "";
  const caption = data.caption || data.title || "";
  return (
    <div className="p-5 sm:p-6">
      {image ? (
        <img src={image} alt={caption || "QR Image"} className="w-full rounded-xl border border-neutral-100 object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
          No image available.
        </div>
      )}
      {caption && <p className="mt-3 text-center text-sm font-medium text-neutral-700">{caption}</p>}
    </div>
  );
}

function VideoContent({ data }: { data: Record<string, any> }) {
  const video = data.video || data.videoUrl || data.url || "";
  const caption = data.caption || data.title || "";
  return (
    <div className="p-5 sm:p-6">
      {video ? (
        <video controls className="w-full rounded-xl border border-neutral-100">
          <source src={video} />
        </video>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
          No video available.
        </div>
      )}
      {caption && <p className="mt-3 text-center text-sm font-medium text-neutral-700">{caption}</p>}
    </div>
  );
}

function AudioContent({ data }: { data: Record<string, any> }) {
  const audio = data.audio || data.audioUrl || data.url || "";
  const caption = data.caption || data.title || "";
  return (
    <div className="p-5 sm:p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <MessageSquare className="h-7 w-7" style={{ color: "var(--accent)" }} />
      </div>
      {caption && <p className="mb-3 text-sm font-medium text-neutral-700">{caption}</p>}
      {audio ? (
        <audio controls className="w-full">
          <source src={audio} />
        </audio>
      ) : (
        <p className="text-sm text-neutral-400">No audio available.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Social — reads content.profiles / displayName / bio / avatarUrl     */
/* ------------------------------------------------------------------ */

function SocialContent({ data }: { data: Record<string, any> }) {
  const profiles: { platform: string; handle?: string; url: string }[] = data.profiles || [];
  const displayName = data.displayName || "Your Name";
  const bio = data.bio || "";
  const avatarUrl = data.avatarUrl || "";
  const theme = data.theme || "light";

  const dark = theme === "dark";
  const gradient = theme === "gradient";

  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-9 text-center sm:px-8 sm:py-11"
      style={{
        background: gradient ? "linear-gradient(135deg,#000099,#7c3aed)" : dark ? "#0f0f1a" : undefined,
        color: dark || gradient ? "#fff" : "#14151A",
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/15 sm:h-20 sm:w-20">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <User className={`h-7 w-7 ${dark || gradient ? "text-white" : "text-neutral-400"}`} />
        )}
      </div>
      <div>
        <p className="text-base font-bold sm:text-lg">{displayName}</p>
        {bio && <p className={`mt-1 max-w-xs text-[13px] ${dark || gradient ? "text-white/75" : "text-neutral-500"}`}>{bio}</p>}
      </div>

      <div className="mt-2 w-full space-y-2">
        {profiles.map((p, i) => {
          const meta = socialMeta(p.platform);
          return (
            <a
              key={i}
              href={p.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition"
              style={{
                backgroundColor: dark || gradient ? "rgba(255,255,255,0.12)" : "#F5F5F4",
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: dark || gradient ? "rgba(255,255,255,0.15)" : `${meta.brand}1a` }}>
                <meta.icon className="h-3.5 w-3.5" style={{ color: dark || gradient ? "#fff" : meta.brand }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{p.platform}</p>
                {p.handle && <p className={`truncate text-[11px] ${dark || gradient ? "text-white/60" : "text-neutral-400"}`}>{p.handle}</p>}
              </div>
              <ExternalLink className={`h-3.5 w-3.5 shrink-0 ${dark || gradient ? "text-white/50" : "text-neutral-300"}`} />
            </a>
          );
        })}
        {profiles.length === 0 && (
          <p className={`py-4 text-xs ${dark || gradient ? "text-white/60" : "text-neutral-400"}`}>No social links added yet.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event — reads full date/time range, allDay, reminder, organizer;    */
/*  offers an .ics "Add to Calendar" download                          */
/* ------------------------------------------------------------------ */

function formatEventDate(date: string, time: string, allDay: boolean) {
  if (!date) return "";
  const iso = allDay ? date : `${date}T${time || "00:00"}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return date;
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  if (allDay) return dateStr;
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function EventContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const title = data.title || "Event";
  const description = data.description || "";
  const location = data.location || "";
  const allDay = !!data.allDay;
  const organizerName = data.organizerName || "";
  const reminder = data.reminder || "";

  const startLabel = formatEventDate(data.startDate, data.startTime, allDay);
  const endLabel = formatEventDate(data.endDate, data.endTime, allDay);
  const sameDay = data.startDate === data.endDate;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 sm:px-8" style={{ backgroundColor: "var(--accent)" }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <CalendarPlus className="h-5 w-5 text-white" />
        </div>
        <h2 className="truncate text-base font-bold text-white sm:text-lg">{title}</h2>
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-8">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          <div className="text-[13px] text-neutral-700">
            <p className="font-medium">{startLabel}</p>
            {!sameDay && endLabel && <p className="text-neutral-500">to {endLabel}</p>}
            {sameDay && !allDay && data.endTime && (
              <p className="text-neutral-500">
                until {new Date(`${data.endDate}T${data.endTime}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {location && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <p className="truncate text-[13px] text-neutral-700">{location}</p>
          </div>
        )}

        {organizerName && (
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[13px] text-neutral-700">Hosted by {organizerName}</p>
          </div>
        )}

        {description && (
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] leading-relaxed text-neutral-600">{description}</p>
        )}

        {reminder && reminder !== "none" && (
          <p className="text-[11px] text-neutral-400">Reminder set for {reminder} before</p>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => downloadICS(shortCode, data)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <CalendarPlus className="h-4 w-4" /> Add to Calendar
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback — renders headline/subheading + the real questions array   */
/* ------------------------------------------------------------------ */

function FeedbackContent({ data, shortCode }: { data: Record<string, any>; shortCode: string }) {
  const headline = data.headline || "How was your experience?";
  const subheading = data.subheading || "";
  const questions: { id: string; type: "rating" | "text" | "yesno"; label: string; required?: boolean }[] = data.questions || [];
  const thankYouMessage = data.thankYouMessage || "Thanks for your feedback!";

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center sm:px-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
          <ShieldCheck className="h-7 w-7" style={{ color: "var(--accent)" }} />
        </div>
        <p className="text-sm font-semibold text-neutral-900">{thankYouMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-7 text-center sm:px-8">
        <h2 className="text-lg font-bold text-neutral-900">{headline}</h2>
        {subheading && <p className="mt-1 text-[13px] text-neutral-500">{subheading}</p>}
      </div>

      <div className="mt-5 space-y-5 px-6 sm:px-8">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-[13px] font-medium text-neutral-800">
              {q.label}{q.required && <span style={{ color: "var(--accent)" }}> *</span>}
            </p>

            {q.type === "rating" && (
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = (answers[q.id] || 0) > i;
                  return (
                    <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i + 1 }))}>
                      <Star className={`h-6 w-6 ${filled ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "yesno" && (
              <div className="flex gap-2">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className="flex-1 rounded-xl border py-2 text-[13px] font-medium"
                    style={
                      answers[q.id] === opt
                        ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                        : { borderColor: "#e5e5e5", color: "#404040" }
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Type your answer…"
                className="min-h-[70px] w-full rounded-xl border border-neutral-200 p-3 text-[13px] outline-none focus:border-neutral-400"
              />
            )}
          </div>
        ))}
        {questions.length === 0 && (
          <p className="py-4 text-center text-xs text-neutral-400">No questions added yet.</p>
        )}
      </div>

      <div className="px-6 py-6 sm:px-8">
        <button
          onClick={() => {
            trackClickBeacon(shortCode);
            setSubmitted(true);
          }}
          className="flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Submit
        </button>
        {data.allowAnonymous && (
          <p className="mt-2 text-center text-[11px] text-neutral-400">Your response is anonymous</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Menu — reads content.categories[].items[] + restaurantName/currency */
/* ------------------------------------------------------------------ */

function MenuContent({ data }: { data: Record<string, any> }) {
  const restaurantName = data.restaurantName || "Restaurant Name";
  const currency = data.currency || "₹";
  const categories: { id: string; name: string; items: { id: string; name: string; price: string }[] }[] = data.categories || [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-2 px-5 py-6 text-center text-white sm:px-8" style={{ backgroundColor: "var(--accent)" }}>
        <UtensilsCrossed className="h-6 w-6" />
        <h2 className="text-lg font-bold">{restaurantName}</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Menu</p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{cat.name}</p>
            <div className="space-y-1.5">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-neutral-100 py-1.5">
                  <span className="text-[13px] text-neutral-800">{item.name || "Item"}</span>
                  <span className="text-[13px] font-semibold text-neutral-600">{currency}{item.price || "0"}</span>
                </div>
              ))}
              {cat.items.length === 0 && <p className="py-1 text-xs text-neutral-400">No items in this category.</p>}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="py-6 text-center text-xs text-neutral-400">No menu items added yet.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Playlist                                                            */
/* ------------------------------------------------------------------ */

function PlaylistContent({ data }: { data: Record<string, any> }) {
  const tracks: { title: string; artist?: string; url?: string }[] = data.tracks || [];

  return (
    <div className="p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">{data.title || "Playlist"}</h2>
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <a
            key={index}
            href={track.url || "#"}
            target={track.url ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:bg-neutral-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
              <span className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>{index + 1}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-neutral-800">{track.title}</p>
              {track.artist && <p className="truncate text-[11px] text-neutral-500">{track.artist}</p>}
            </div>
          </a>
        ))}
        {tracks.length === 0 && <p className="text-sm text-neutral-400">No tracks found.</p>}
      </div>
    </div>
  );
}