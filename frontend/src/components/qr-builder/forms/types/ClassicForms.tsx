// components/qr-builder/forms/types/ClassicForms.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText, MessageSquare, Wifi, Mail, Phone, MapPin, Lock, User, MessageCircle, Globe, Eye,
  EyeOff,
} from "lucide-react";
import type {
  TextValue, WhatsappValue, WifiValue, EmailValue, PhoneValue, SmsValue, LocationValue,
} from "@/lib/qr-types/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
interface FormProps<T> { value: T; onChange: (v: T) => void; errors?: Record<string, string> }

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */
export function TextForm({ value, onChange, errors }: FormProps<TextValue>) {
  return (
    <FormSection title="Plain text" icon={FileText} defaultOpen error={errors?.text}>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Your text</Label>
        <Textarea
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Enter text…"
          className={`min-h-[110px] ${errorRing(!!errors?.text)}`}
        />
        <FieldError message={errors?.text} />
      </div>
    </FormSection>
  );
}
export function TextPreview({ value }: { value: TextValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <p className="text-xs font-semibold text-foreground mb-2">Plain Text</p>
        <div className="bg-secondary/30 rounded-xl p-3 border border-border/20">
          <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{value.text || "Your text will appear here…"}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WhatsApp                                                            */
/* ------------------------------------------------------------------ */
export function WhatsappForm({ value, onChange, errors }: FormProps<WhatsappValue>) {
  return (
    <FormSection title="WhatsApp" icon={MessageSquare} defaultOpen error={errors?.phone}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Phone (with country code)</Label>
          <Input
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className={`h-10 ${errorRing(!!errors?.phone)}`}
          />
          <FieldError message={errors?.phone} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Pre-filled message (optional)</Label>
          <Input
            value={value.message}
            onChange={(e) => onChange({ ...value, message: e.target.value })}
            placeholder="Hi! Found you via QR"
            className={`h-10 ${errorRing(!!errors?.message)}`}
          />
          <FieldError message={errors?.message} />
        </div>
      </div>
    </FormSection>
  );
}
export function WhatsappPreview({ value }: { value: WhatsappValue }) {
  return (
    <div className="w-[228px] rounded-xl overflow-hidden border border-border bg-[#ece5dd]">
      <div className="bg-[#075e54] px-3 py-2.5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">{value.phone || "+91 XXXXX XXXXX"}</p>
          <p className="text-[9px] text-white/70">online</p>
        </div>
      </div>
      <div className="min-h-[140px] px-3 py-4 flex flex-col justify-end">
        <div className="self-end max-w-[85%]">
          <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
            <p className="text-[11px] text-[#303030]">{value.message || "Hi! 👋"}</p>
            <p className="text-[8px] text-[#999] text-right mt-0.5">9:41 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wi-Fi                                                                */
/* ------------------------------------------------------------------ */
export function WifiForm({ value, onChange, errors }: FormProps<WifiValue>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <FormSection title="Wi-Fi network" icon={Wifi} defaultOpen error={errors?.ssid || errors?.password}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Network name (SSID)</Label>
          <Input
            value={value.ssid}
            onChange={(e) => onChange({ ...value, ssid: e.target.value })}
            placeholder="MyWiFi"
            className={`h-10 ${errorRing(!!errors?.ssid)}`}
          />
          <FieldError message={errors?.ssid} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Password</Label>
          <Input
            type={showPassword ? "text" : "password"}
            value={value.password}
            onChange={(e) =>
              onChange({
                ...value,
                password: e.target.value,
              })
            }
            placeholder="••••••••"
            className={`h-10 pr-10 ${errorRing(
              !!errors?.password
            )}`}
          />
          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <FieldError message={errors?.password} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Encryption</Label>
          <Select
            value={value.encryption}
            onValueChange={(v) =>
              onChange({
                ...value,
                encryption: v as "WPA" | "WEP" | "nopass",
              })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select encryption" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="WPA">
                WPA
              </SelectItem>

              <SelectItem value="WEP">
                WEP
              </SelectItem>

              <SelectItem value="nopass">
                None
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormSection>
  );
}
export function WifiPreview({ value }: { value: WifiValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-background px-4 pt-4 pb-4">
      <p className="text-xs font-semibold text-foreground mb-4">Wi-Fi</p>
      <div className="bg-primary/8 rounded-xl p-3 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{value.ssid || "Network Name"}</p>
              <p className="text-[9px] text-primary">Connected</p>
            </div>
          </div>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between">
          <span className="text-[9px] text-muted-foreground">Security: {value.encryption}</span>
          <span className="text-[9px] text-primary font-medium">Auto-Join ✓</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Email                                                                */
/* ------------------------------------------------------------------ */
export function EmailForm({ value, onChange, errors }: FormProps<EmailValue>) {
  return (
    <FormSection title="Email" icon={Mail} defaultOpen error={errors?.email}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Email address</Label>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="hello@example.com"
            className={`h-10 ${errorRing(!!errors?.email)}`}
          />
          <FieldError message={errors?.email} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
          <Input value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} placeholder="Subject" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Message</Label>
          <Input value={value.body} onChange={(e) => onChange({ ...value, body: e.target.value })} placeholder="Your message…" className="h-10" />
        </div>
      </div>
    </FormSection>
  );
}
export function EmailPreview({ value }: { value: EmailValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <p className="text-xs font-semibold text-foreground">New Message</p>
      </div>
      <div className="px-4 py-2">
        <div className="flex items-center py-2 border-b border-border/20">
          <span className="text-[10px] text-muted-foreground w-10">To:</span>
          <span className="text-[11px] text-foreground truncate">{value.email || "hello@example.com"}</span>
        </div>
        <div className="flex items-center py-2 border-b border-border/20">
          <span className="text-[10px] text-muted-foreground w-10">Sub:</span>
          <span className="text-[11px] text-foreground truncate">{value.subject || "Subject line"}</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] text-foreground/70 leading-relaxed">{value.body || "Your message here…"}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone call                                                           */
/* ------------------------------------------------------------------ */
export function PhoneCallForm({ value, onChange, errors }: FormProps<PhoneValue>) {
  return (
    <FormSection title="Phone number" icon={Phone} defaultOpen error={errors?.phone}>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Phone number</Label>
        <Input
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="+91 98765 43210"
          className={`h-10 ${errorRing(!!errors?.phone)}`}
        />
        <FieldError message={errors?.phone} />
      </div>
    </FormSection>
  );
}
export function PhoneCallPreview({ value }: { value: PhoneValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-gradient-to-b from-foreground/5 to-foreground/10 px-4 py-8 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
        <User className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">{value.phone || "+91 XXXXX XXXXX"}</p>
      <p className="text-[10px] text-muted-foreground mt-1">Mobile</p>
      <div className="flex gap-6 mt-6">
        {[{ icon: Phone, color: "bg-green-500", label: "Call" }, { icon: MessageCircle, color: "bg-primary", label: "Message" }].map((a) => (
          <div key={a.label} className="flex flex-col items-center gap-1.5">
            <div className={`w-11 h-11 rounded-full ${a.color} flex items-center justify-center`}>
              <a.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[9px] text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SMS                                                                  */
/* ------------------------------------------------------------------ */
export function SmsForm({ value, onChange, errors }: FormProps<SmsValue>) {
  return (
    <FormSection title="SMS" icon={MessageSquare} defaultOpen error={errors?.phone}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Phone number</Label>
          <Input
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className={`h-10 ${errorRing(!!errors?.phone)}`}
          />
          <FieldError message={errors?.phone} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Message</Label>
          <Input value={value.message} onChange={(e) => onChange({ ...value, message: e.target.value })} placeholder="Your message…" className="h-10" />
        </div>
      </div>
    </FormSection>
  );
}
export function SmsPreview({ value }: { value: SmsValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold text-foreground">{value.phone || "+91 XXXXX XXXXX"}</p>
      </div>
      <div className="min-h-[140px] px-3 py-4 flex flex-col justify-end">
        <div className="self-end max-w-[85%]">
          <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-[11px] text-primary-foreground">{value.message || "Your message…"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Location                                                             */
/* ------------------------------------------------------------------ */
export function LocationForm({ value, onChange, errors }: FormProps<LocationValue>) {
  const mode = value.mode || "coords";
  return (
    <FormSection
      title="Location"
      icon={MapPin}
      defaultOpen
      error={errors?.latitude || errors?.longitude || errors?.mapsUrl}
    >
      <div className="space-y-3">
        {/* Choice: coordinates vs a pasted Google Maps URL */}
        <div className="flex rounded-lg border border-border p-1 bg-secondary/30">
          <button
            type="button"
            onClick={() => onChange({ ...value, mode: "coords" })}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${mode === "coords" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Lat / Long
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, mode: "url" })}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${mode === "url" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Google Maps URL
          </button>
        </div>

        {mode === "coords" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Latitude</Label>
              <Input
                value={value.latitude}
                onChange={(e) => onChange({ ...value, latitude: e.target.value })}
                placeholder="28.6139"
                className={`h-10 ${errorRing(!!errors?.latitude)}`}
              />
              <FieldError message={errors?.latitude} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Longitude</Label>
              <Input
                value={value.longitude}
                onChange={(e) => onChange({ ...value, longitude: e.target.value })}
                placeholder="77.2090"
                className={`h-10 ${errorRing(!!errors?.longitude)}`}
              />
              <FieldError message={errors?.longitude} />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Google Maps link</Label>
            <Input
              value={value.mapsUrl}
              onChange={(e) => onChange({ ...value, mapsUrl: e.target.value })}
              placeholder="https://maps.app.goo.gl/… or https://maps.google.com/?q=…"
              className={`h-10 ${errorRing(!!errors?.mapsUrl)}`}
            />
            <FieldError message={errors?.mapsUrl} />
            <p className="text-[10.5px] text-muted-foreground">Open Google Maps, tap Share, and paste the link here.</p>
          </div>
        )}
      </div>
    </FormSection>
  );
}
export function LocationPreview({ value }: { value: LocationValue }) {
  const mode = value.mode || "coords";
  const lat = value.latitude || "28.6139";
  const lng = value.longitude || "77.2090";
  const mapsUrl = value.mapsUrl || "https://maps.google.com";
  return (
    <div className="w-[228px] rounded-xl border border-border overflow-hidden">
      <div className="h-[140px] bg-primary/5 relative flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <MapPin className="w-9 h-9 text-destructive drop-shadow-lg" />
          <div className="bg-card shadow-lg rounded-lg px-2.5 py-1.5 mt-2 max-w-[190px]">
            {mode === "coords" ? (
              <p className="text-[10px] font-semibold text-foreground">{lat}°N, {lng}°E</p>
            ) : (
              <p className="text-[10px] font-semibold text-foreground truncate">Google Maps link</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-3 bg-card">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Pinned Location</p>
            <p className="text-[9px] text-muted-foreground truncate">
              {mode === "coords" ? `${lat}, ${lng}` : mapsUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
