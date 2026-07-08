"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, User, CreditCard, MessageSquare, Wifi,
  Mail, Phone, MapPin, FileText, MessageCircle,
  ExternalLink, Lock, Link2, ShieldCheck, ArrowRight,
} from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaXTwitter, FaYoutube, FaGithub, FaFacebookF, FaTiktok } from "react-icons/fa6";
import { fetchQrByShortCode } from "@/store/slices/qrSlice";
import type { AppDispatch, RootState } from "@/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type QRType =
  | "url" | "text" | "whatsapp" | "upi" | "wifi"
  | "vcard" | "email" | "phone" | "sms" | "location";

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
  Website: { icon: Globe, brand: "#1a1a2e" },
  Custom: { icon: Link2, brand: "#475569" },
};

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
  const accent = design.accentColor || design.fgColor || "#0d9488";
  const type = currentShortQr.type as QRType;
  const primaryAction = getPrimaryAction(type, currentShortQr.content || {});

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#FAFAF8] text-[#14151A]"
      style={{ ["--accent" as string]: accent }}
    >
      {/* Ambient accent glow — makes each card feel like it belongs to its owner */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.14] blur-3xl"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}, transparent)` }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-8 sm:max-w-lg sm:px-6 sm:pt-14 lg:max-w-xl">
        {/* Entry moment: a single scan-pulse, not a decoration that repeats */}
        <div className="mb-5 flex justify-center sm:mb-7">
          <ScanPulse accent={accent} active={justArrived} />
        </div>

        {/* The card — the whole reason someone is here */}
        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent(type, currentShortQr.content || {}, design)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quiet provenance line — who made this, not how many times it's been scanned */}
        <p className="mt-5 text-center text-[12px] text-neutral-400 sm:mt-6">
          Shared by <span className="font-medium text-neutral-500">{currentShortQr.name || "a Virexa user"}</span>
        </p>

        <div className="mt-auto" />

        <BrandFooter accent={accent} />
      </div>

      {/* Thumb-reachable action bar on small screens, mirrors the card's own CTA */}
      {primaryAction && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 p-3 backdrop-blur sm:hidden">
          <a
            href={primaryAction.href}
            target={primaryAction.external ? "_blank" : undefined}
            rel={primaryAction.external ? "noreferrer" : undefined}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {primaryAction.label} <ArrowRight className="h-4 w-4" />
          </a>
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

function getPrimaryAction(type: QRType, data: Record<string, any>): { label: string; href: string; external?: boolean } | null {
  switch (type) {
    case "url":
      return { label: "Visit site", href: data.url || "#", external: true };
    case "location": {
      const lat = data.latitude || "28.6139";
      const lng = data.longitude || "77.2090";
      return { label: "Get directions", href: `https://www.google.com/maps?q=${lat},${lng}`, external: true };
    }
    case "phone":
      return { label: "Call now", href: `tel:${data.phone || ""}` };
    case "sms":
      return { label: "Send message", href: `sms:${data.phone || ""}` };
    case "email":
      return { label: "Send email", href: `mailto:${data.email || ""}` };
    case "whatsapp":
      return { label: "Open WhatsApp", href: `https://wa.me/${(data.phone || "").replace(/\D/g, "")}`, external: true };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Content router                                                     */
/* ------------------------------------------------------------------ */

function renderContent(type: QRType, data: Record<string, any>, design: QrDesign) {
  switch (type) {
    case "url": return <URLContent data={data} />;
    case "vcard": return <VCardContent data={data} design={design} />;
    case "upi": return <UPIContent data={data} />;
    case "whatsapp": return <WhatsAppContent data={data} />;
    case "wifi": return <WifiContent data={data} />;
    case "email": return <EmailContent data={data} />;
    case "phone": return <PhoneCallContent data={data} />;
    case "sms": return <SMSContent data={data} />;
    case "location": return <LocationContent data={data} />;
    case "text": return <TextContent data={data} />;
    default: return <URLContent data={data} />;
  }
}

/* ------------------------------------------------------------------ */
/*  URL                                                                 */
/* ------------------------------------------------------------------ */

function URLContent({ data }: { data: Record<string, any> }) {
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
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Visit site <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
          <ShieldCheck className="h-3 w-3" /> Scanned links are shown before you open them
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VCard                                                               */
/* ------------------------------------------------------------------ */

function VCardContent({ data, design }: { data: Record<string, any>; design: QrDesign }) {
  const name = data.fullName || "Your Name";
  const role = data.role || (data.company ? "Team Member" : "Your Role");
  const company = data.company || "";
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const phones: { label: string; value: string }[] = data.phones || [];
  const emails: { label: string; value: string }[] = data.emails || [];
  const socials: { label: string; value: string }[] = data.socials || [];

  const banner = design.bannerColor || "#000099";
  const accent = design.accentColor || banner;

  return (
    <div className="flex flex-col">
      <div className="relative px-5 pb-14 pt-7 sm:px-8" style={{ backgroundColor: banner }}>
        <p
          className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {company || "Digital Card"}
        </p>
      </div>

      <div className="relative -mt-11 flex justify-center sm:-mt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-md sm:h-24 sm:w-24">
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{ backgroundColor: `${accent}26` }}
          >
            <span className="text-xl font-bold sm:text-2xl" style={{ color: accent }}>{initials}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 px-4 text-center">
        <h3 className="text-lg font-bold leading-tight text-neutral-900 sm:text-xl">{name}</h3>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">{role}</p>
      </div>

      <div className="mt-5 space-y-2 px-4 pb-4 sm:px-8">
        {phones.map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {emails.map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
        {socials.map((s, i) => {
          const meta = SOCIAL_ICONS[s.label] || SOCIAL_ICONS.Custom;
          return <ContactRow key={`s${i}`} icon={meta.icon} label={s.label} value={s.value} accent={meta.brand} />;
        })}
        {phones.length === 0 && emails.length === 0 && socials.length === 0 && (
          <p className="py-6 text-center text-xs text-neutral-400">No contact details added yet.</p>
        )}
      </div>

      <div className="px-4 pb-5 sm:px-8">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white">
          <User className="h-4 w-4" /> Add to Contacts
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-400">Saves directly to your phone — no app needed</p>
      </div>
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

function UPIContent({ data }: { data: Record<string, any> }) {
  const name = data.name || "Payee Name";
  const amount = data.amount || "0.00";
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <CreditCard className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <p className="mt-3 text-base font-semibold text-neutral-900 sm:text-lg">{name}</p>
      {data.upiId && <p className="mt-0.5 text-xs text-neutral-500">{data.upiId}</p>}

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Amount</p>
        <p className="mt-1 text-4xl font-bold text-neutral-900 sm:text-5xl">₹{amount}</p>
      </div>

      {data.note && (
        <p className="mt-3 rounded-full bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500">{data.note}</p>
      )}

      <button
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

function WhatsAppContent({ data }: { data: Record<string, any> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Hi! 👋";
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
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#075e54] text-sm font-semibold text-white">
          <MessageSquare className="h-4 w-4" /> Open WhatsApp
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wifi                                                                */
/* ------------------------------------------------------------------ */

function WifiContent({ data }: { data: Record<string, any> }) {
  const ssid = data.ssid || "Network Name";
  const enc = data.encryption || "WPA";
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <Wifi className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">{ssid}</h2>
      <p className="mt-1 text-xs text-neutral-500">Secured with {enc}</p>

      <button
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

function EmailContent({ data }: { data: Record<string, any> }) {
  const email = data.email || "hello@example.com";
  const subject = data.subject || "Subject line";
  const body = data.body || "Your message here...";
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
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Mail className="h-4 w-4" /> Send Email
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phone / SMS                                                        */
/* ------------------------------------------------------------------ */

function PhoneCallContent({ data }: { data: Record<string, any> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-neutral-50 to-white px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm sm:h-24 sm:w-24">
        <User className="h-9 w-9 text-neutral-400 sm:h-11 sm:w-11" />
      </div>
      <p className="mt-4 text-xl font-semibold text-neutral-900 sm:text-2xl">{phone}</p>
      <p className="mt-1 text-xs text-neutral-500">Mobile</p>
      <div className="mt-8 flex w-full max-w-xs gap-3">
        <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-white">
          <Phone className="h-4 w-4" /> Call
        </a>
        <a href={`sms:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
          <MessageCircle className="h-4 w-4" /> Message
        </a>
      </div>
    </div>
  );
}

function SMSContent({ data }: { data: Record<string, any> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Your message...";
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
        <a
          href={`sms:${phone}?body=${encodeURIComponent(message)}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Send Message
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Location                                                            */
/* ------------------------------------------------------------------ */

function LocationContent({ data }: { data: Record<string, any> }) {
  const lat = data.latitude || "28.6139";
  const lng = data.longitude || "77.2090";
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
        <p className="mt-0.5 text-[11px] text-neutral-500">{lat}°N, {lng}°E</p>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <MapPin className="h-4 w-4" /> Get Directions
        </a>
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