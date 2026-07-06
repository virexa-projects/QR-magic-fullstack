"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, User, CreditCard, MessageSquare, Wifi,
  Mail, Phone, MapPin, FileText, MessageCircle,
  ExternalLink, Signal, Lock, Link2,
} from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaXTwitter, FaYoutube, FaGithub, FaFacebookF, FaTiktok } from "react-icons/fa6";

type QRType = "url" | "text" | "whatsapp" | "upi" | "wifi" | "vcard" | "email" | "phone" | "sms" | "location";

export interface CardDesign {
  banner: string;
  accent: string;
}

interface PhonePreviewProps {
  type: QRType;
  data: Record<string, string>;
  cardDesign?: CardDesign;
}

const SOCIAL_ICONS: Record<string, { icon: React.ElementType; brand: string }> = {
  LinkedIn:  { icon: FaLinkedinIn, brand: "#0A66C2" },
  Instagram: { icon: FaInstagram,  brand: "#E4405F" },
  X:         { icon: FaXTwitter,   brand: "#000000" },
  YouTube:   { icon: FaYoutube,    brand: "#FF0000" },
  Facebook:  { icon: FaFacebookF,  brand: "#1877F2" },
  TikTok:    { icon: FaTiktok,     brand: "#000000" },
  GitHub:    { icon: FaGithub,     brand: "#181717" },
  Website:   { icon: Globe,        brand: "#1a1a2e" },
  Custom:    { icon: Link2,        brand: "#475569" },
};

export default function PhonePreview({ type, data, cardDesign }: PhonePreviewProps) {
  return (
    <div className="relative mx-auto w-[260px]">
      {/* Phone Frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[22px] bg-foreground/90 rounded-b-2xl z-20" />
        
        {/* Status Bar */}
        <div className="relative h-[44px] bg-card flex items-end justify-between px-6 pb-1 z-10">
          <span className="text-[10px] font-semibold text-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-foreground" />
            <Wifi className="w-3 h-3 text-foreground" />
            <div className="w-5 h-2.5 rounded-sm border border-foreground/60 relative">
              <div className="absolute inset-[1px] right-[2px] bg-foreground/60 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="bg-card min-h-[420px] max-h-[420px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent(type, data, cardDesign)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Home Indicator */}
        <div className="bg-card pb-2 pt-1 flex justify-center">
          <div className="w-[100px] h-[4px] rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
}

function renderContent(type: QRType, data: Record<string, string>, cardDesign?: CardDesign) {
  switch (type) {
    case "url":
      return <URLPreview data={data} />;
    case "vcard":
      return <VCardPreview data={data} cardDesign={cardDesign} />;
    case "upi":
      return <UPIPreview data={data} />;
    case "whatsapp":
      return <WhatsAppPreview data={data} />;
    case "wifi":
      return <WifiPreview data={data} />;
    case "email":
      return <EmailPreview data={data} />;
    case "phone":
      return <PhoneCallPreview data={data} />;
    case "sms":
      return <SMSPreview data={data} />;
    case "location":
      return <LocationPreview data={data} />;
    case "text":
      return <TextPreview data={data} />;
    default:
      return <URLPreview data={data} />;
  }
}

function URLPreview({ data }: { data: Record<string, string> }) {
  const url = data.url || "https://yourwebsite.com";
  const domain = url.replace(/https?:\/\//, "").split("/")[0] || "yourwebsite.com";
  return (
    <div className="flex flex-col h-full">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-b border-border/30">
        <Lock className="w-3 h-3 text-muted-foreground" />
        <div className="flex-1 bg-background rounded-md px-2 py-1">
          <p className="text-[10px] text-muted-foreground truncate">{domain}</p>
        </div>
      </div>
      {/* Website content mockup */}
      <div className="flex-1 p-4 space-y-3">
        <div className="w-full h-20 rounded-lg bg-primary/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-primary/40" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-foreground/10 rounded w-3/4" />
          <div className="h-2 bg-foreground/5 rounded w-full" />
          <div className="h-2 bg-foreground/5 rounded w-5/6" />
          <div className="h-2 bg-foreground/5 rounded w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-primary/15 rounded-lg flex-1 flex items-center justify-center">
            <span className="text-[9px] text-primary font-medium">Visit Site</span>
          </div>
          <div className="h-8 bg-secondary rounded-lg w-8 flex items-center justify-center">
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-2 bg-foreground/5 rounded w-full" />
          <div className="h-2 bg-foreground/5 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

function parseList(raw?: string): { label: string; value: string }[] {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v.filter((x) => x?.value) : []; } catch { return []; }
}

function VCardPreview({ data, cardDesign }: { data: Record<string, string>; cardDesign?: CardDesign }) {
  const name = data.fullName || "Your Name";
  const role = data.role || (data.company ? "Team Member" : "Your Role");
  const company = data.company || "";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const phones = parseList(data.phones);
  const emails = parseList(data.emails);
  const socials = parseList(data.socials);

  const banner = cardDesign?.banner || "#000099";
  const accent = cardDesign?.accent || "#000099";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Colored banner header */}
      <div className="relative px-4 pt-5 pb-12" style={{ backgroundColor: banner }}>
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.85)" }}>
          {company || "Digital Card"}
        </p>
      </div>

      {/* Avatar overlapping banner */}
      <div className="relative -mt-10 flex justify-center">
        <div className="w-[68px] h-[68px] rounded-full bg-card border-[3px] border-card shadow-md overflow-hidden">
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}26` }}>
            <span className="text-lg font-bold" style={{ color: accent }}>{initials}</span>
          </div>
        </div>
      </div>

      {/* Name + role */}
      <div className="text-center px-4 mt-2">
        <h3 className="text-[15px] font-bold text-foreground leading-tight">{name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{role}</p>
      </div>

      {/* Quick action circles */}
      <div className="flex justify-center gap-3 mt-3 px-4">
        {[
          { icon: Phone, enabled: phones.length > 0 },
          { icon: Mail, enabled: emails.length > 0 },
          { icon: MessageCircle, enabled: phones.length > 0 },
        ].map((a, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
            style={a.enabled ? { backgroundColor: accent, color: "#fff" } : undefined}
          >
            <a.icon className={`w-3.5 h-3.5 ${a.enabled ? "" : "text-muted-foreground/50"}`} style={a.enabled ? { color: "#fff" } : undefined} />
          </div>
        ))}
      </div>

      {/* Contact rows */}
      <div className="flex-1 px-3 mt-3 space-y-1 overflow-y-auto">
        {phones.map((p, i) => <VContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {emails.map((e, i) => <VContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
        {socials.slice(0, 4).map((s, i) => {
          const meta = SOCIAL_ICONS[s.label] || SOCIAL_ICONS.Custom;
          return <VContactRow key={`s${i}`} icon={meta.icon} label={s.label} value={s.value} accent={meta.brand} />;
        })}
        {phones.length === 0 && emails.length === 0 && socials.length === 0 && (
          <>
            <VContactSkeleton />
            <VContactSkeleton />
          </>
        )}
      </div>

      {/* Add to Contacts CTA */}
      <div className="px-4 pb-3 pt-2">
        <div className="w-full h-9 rounded-lg bg-foreground flex items-center justify-center gap-1.5">
          <User className="w-3 h-3 text-background" />
          <span className="text-[11px] font-semibold text-background">Add to Contacts</span>
        </div>
      </div>
    </div>
  );
}

function VContactRow({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-secondary/40">
      <div className="w-7 h-7 rounded-md bg-card flex items-center justify-center shrink-0" style={accent ? { backgroundColor: `${accent}14` } : undefined}>
        <Icon className="w-3.5 h-3.5" style={{ color: accent || "hsl(var(--primary))" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[10.5px] text-foreground truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function VContactSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-secondary/40">
      <div className="w-7 h-7 rounded-md bg-card" />
      <div className="space-y-1 flex-1">
        <div className="h-1.5 w-10 bg-foreground/10 rounded" />
        <div className="h-2 w-28 bg-foreground/15 rounded" />
      </div>
    </div>
  );
}

function UPIPreview({ data }: { data: Record<string, string> }) {
  const name = data.name || "Payee Name";
  const amount = data.amount || "0.00";
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3">
        <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">UPI Payment</p>
      </div>
      <div className="flex-1 px-4 pt-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <CreditCard className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        {data.upiId && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{data.upiId}</p>
        )}
        
        {/* Amount */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
          <p className="text-3xl font-bold text-foreground mt-1">₹{amount}</p>
        </div>

        {data.note && (
          <p className="text-[10px] text-muted-foreground mt-3 bg-secondary/50 px-3 py-1.5 rounded-full">
            {data.note}
          </p>
        )}

        {/* Pay button */}
        <div className="w-full mt-auto pb-4">
          <div className="w-full h-11 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">Pay ₹{amount}</span>
          </div>
          {/* Payment apps */}
          <div className="flex justify-center gap-4 mt-3">
            {["GPay", "PhonePe", "Paytm"].map((app) => (
              <span key={app} className="text-[9px] text-muted-foreground">{app}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppPreview({ data }: { data: Record<string, string> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Hi! 👋";
  return (
    <div className="flex flex-col h-full bg-[#ece5dd]">
      {/* WhatsApp header */}
      <div className="bg-[#075e54] px-3 py-2.5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">{phone}</p>
          <p className="text-[9px] text-white/70">online</p>
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 px-3 py-4 flex flex-col justify-end">
        {message && (
          <div className="self-end max-w-[80%]">
            <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
              <p className="text-[11px] text-[#303030]">{message}</p>
              <p className="text-[8px] text-[#999] text-right mt-0.5">9:41 AM</p>
            </div>
          </div>
        )}
      </div>
      {/* Input bar */}
      <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-2">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5">
          <p className="text-[10px] text-[#999]">Type a message</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

function WifiPreview({ data }: { data: Record<string, string> }) {
  const ssid = data.ssid || "Network Name";
  const enc = data.encryption || "WPA";
  return (
    <div className="flex flex-col h-full px-4 pt-4">
      <p className="text-xs font-semibold text-foreground mb-4">Wi-Fi</p>
      
      {/* Connected network */}
      <div className="bg-primary/8 rounded-xl p-3 border border-primary/20 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{ssid}</p>
              <p className="text-[9px] text-primary">Connected</p>
            </div>
          </div>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between">
          <span className="text-[9px] text-muted-foreground">Security: {enc}</span>
          <span className="text-[9px] text-primary font-medium">Auto-Join ✓</span>
        </div>
      </div>

      {/* Other networks */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Other Networks</p>
      {["Home_5G", "Office_Guest", "Neighbor_WiFi"].map((net) => (
        <div key={net} className="flex items-center justify-between py-2.5 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground">{net}</span>
          </div>
          <Lock className="w-2.5 h-2.5 text-muted-foreground/30" />
        </div>
      ))}
    </div>
  );
}

function EmailPreview({ data }: { data: Record<string, string> }) {
  const email = data.email || "hello@example.com";
  const subject = data.subject || "Subject line";
  const body = data.body || "Your message here...";
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/30">
        <p className="text-xs font-semibold text-foreground">New Message</p>
      </div>
      <div className="px-4 py-2 space-y-0">
        <div className="flex items-center py-2 border-b border-border/20">
          <span className="text-[10px] text-muted-foreground w-10">To:</span>
          <span className="text-[11px] text-foreground">{email}</span>
        </div>
        <div className="flex items-center py-2 border-b border-border/20">
          <span className="text-[10px] text-muted-foreground w-10">Sub:</span>
          <span className="text-[11px] text-foreground">{subject}</span>
        </div>
      </div>
      <div className="flex-1 px-4 py-3">
        <p className="text-[11px] text-foreground/70 leading-relaxed">{body}</p>
      </div>
      <div className="px-4 py-2 border-t border-border/30 flex justify-end">
        <div className="bg-primary rounded-lg px-4 py-1.5">
          <span className="text-[10px] text-primary-foreground font-medium">Send</span>
        </div>
      </div>
    </div>
  );
}

function PhoneCallPreview({ data }: { data: Record<string, string> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-foreground/5 to-foreground/10 px-4">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold text-foreground">{phone}</p>
      <p className="text-[10px] text-muted-foreground mt-1">Mobile</p>
      
      <div className="flex gap-8 mt-10">
        {[
          { icon: Phone, label: "Call", color: "bg-green-500" },
          { icon: MessageCircle, label: "Message", color: "bg-primary" },
        ].map((a) => (
          <div key={a.label} className="flex flex-col items-center gap-1.5">
            <div className={`w-14 h-14 rounded-full ${a.color} flex items-center justify-center`}>
              <a.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[9px] text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SMSPreview({ data }: { data: Record<string, string> }) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Your message...";
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold text-foreground">{phone}</p>
      </div>
      <div className="flex-1 px-3 py-4 flex flex-col justify-end">
        <div className="self-end max-w-[80%]">
          <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-[11px] text-primary-foreground">{message}</p>
          </div>
          <p className="text-[8px] text-muted-foreground text-right mt-0.5">Just now</p>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-border/30 flex items-center gap-2">
        <div className="flex-1 bg-secondary/50 rounded-full px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground">iMessage</p>
        </div>
      </div>
    </div>
  );
}

function LocationPreview({ data }: { data: Record<string, string> }) {
  const lat = data.latitude || "28.6139";
  const lng = data.longitude || "77.2090";
  return (
    <div className="flex flex-col h-full">
      {/* Map placeholder */}
      <div className="flex-1 bg-primary/5 relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          {/* Grid lines to simulate map */}
          <div className="w-full h-full" style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }} />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <MapPin className="w-10 h-10 text-destructive drop-shadow-lg" />
          <div className="bg-card shadow-lg rounded-lg px-3 py-2 mt-2">
            <p className="text-[10px] font-semibold text-foreground">{lat}°N, {lng}°E</p>
          </div>
        </div>
      </div>
      {/* Bottom info */}
      <div className="px-4 py-3 bg-card">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">Pinned Location</p>
            <p className="text-[9px] text-muted-foreground">{lat}, {lng}</p>
          </div>
        </div>
        <div className="mt-2 w-full h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-[10px] text-primary-foreground font-medium">Open in Maps</span>
        </div>
      </div>
    </div>
  );
}

function TextPreview({ data }: { data: Record<string, string> }) {
  const text = data.text || "Your text will appear here...";
  return (
    <div className="flex flex-col h-full px-4 pt-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs font-semibold text-foreground mb-2">Plain Text</p>
      <div className="bg-secondary/30 rounded-xl p-3 border border-border/20">
        <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-[9px] text-primary font-medium">Copy Text</span>
        </div>
        <div className="flex-1 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground font-medium">Share</span>
        </div>
      </div>
    </div>
  );
}
