// components/qr-builder/forms/types/VCardForm.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import ContactFieldList from "@/components/qr-builder/vcard/ContactFieldList";
import ThemePicker from "@/components/qr-builder/vcard/ThemePicker";
import LayoutPicker from "@/components/qr-builder/vcard/LayoutPicker";
import FontPicker from "@/components/qr-builder/vcard/FontPicker";
import IconStylePicker from "@/components/qr-builder/vcard/IconStylePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User, Phone, Palette, Type, Image as ImageIcon, IdCard, Share2, Mail, Loader2,
  Instagram, Linkedin, Youtube, Facebook, Github, Twitter, Globe, MessageCircle, LayoutTemplate,
} from "lucide-react";
import type { VCardValue } from "@/lib/qr-types/schema";
import { uploadFile, UploadError } from "@/lib/uploadFile";

interface Props { value: VCardValue; onChange: (v: VCardValue) => void; errors?: Record<string, string> }

const SOCIAL_PLATFORMS = ["Instagram", "LinkedIn", "X", "YouTube", "Facebook", "TikTok", "GitHub", "WhatsApp", "Website"];

function socialIcon(label: string) {
  switch (label) {
    case "Instagram": return Instagram;
    case "LinkedIn": return Linkedin;
    case "X": return Twitter;
    case "YouTube": return Youtube;
    case "Facebook": return Facebook;
    case "GitHub": return Github;
    case "WhatsApp": return MessageCircle;
    default: return Globe;
  }
}

export default function VCardForm({ value, onChange, errors }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const set = <K extends keyof VCardValue>(k: K, v: VCardValue[K]) => onChange({ ...value, [k]: v });

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    try {
      // Real multipart/form-data binary upload — hits the multer route on
      // the backend and comes back with a hosted URL, not a base64 blob.
      const url = await uploadFile(file, "vcard-avatars", { onProgress: setUploadPct });
      set("avatarUrl", url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof UploadError ? err.message : "Upload failed — try again");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <FormSection title="Basic info" icon={User} defaultOpen error={errors?.fullName}>
        <div className="space-y-3">
          <Field label="Full name" error={errors?.fullName}>
            <Input
              value={value.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Rahul Sharma"
              className={errorRing(!!errors?.fullName)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title"><Input value={value.role} onChange={(e) => set("role", e.target.value)} placeholder="Marketing Manager" /></Field>
            <Field label="Company"><Input value={value.company} onChange={(e) => set("company", e.target.value)} placeholder="Your Company" /></Field>
          </div>
          <Field label="Short bio" error={errors?.bio}>
            <Textarea
              value={value.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="A short line about you…"
              className={`min-h-[70px] ${errorRing(!!errors?.bio)}`}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Photo" icon={ImageIcon} description="Avatar shown on the card — uploaded as a real file">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary/50 border border-border shrink-0 flex items-center justify-center">
            {value.avatarUrl ? (
              <img src={value.avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <User className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:border-foreground/30 transition">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              {uploading ? `Uploading… ${uploadPct}%` : "Choose photo"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarPick} disabled={uploading} className="hidden" />
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP or GIF — up to 5MB</p>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Phone numbers"
        icon={Phone}
        badge={value.phones.length ? `${value.phones.length} added` : undefined}
        defaultOpen
        error={errors?.phones}
      >
        <ContactFieldList
          items={value.phones}
          labels={["Mobile", "Work", "Home", "Other"]}
          placeholder="+91 98765 43210"
          type="tel"
          onChange={(items) => set("phones", items)}
          error={errors?.phones}
        />
      </FormSection>

      <FormSection title="Email addresses" icon={Mail} badge={value.emails.length ? `${value.emails.length} added` : undefined}>
        <ContactFieldList
          items={value.emails}
          labels={["Work", "Personal", "Other"]}
          placeholder="rahul@example.com"
          type="email"
          onChange={(items) => set("emails", items)}
        />
      </FormSection>

      <FormSection
        title="Social & links"
        icon={Share2}
        description="Instagram, LinkedIn, website — anything you want on the card"
        badge={value.socials.length ? `${value.socials.length} added` : undefined}
      >
        <ContactFieldList
          items={value.socials}
          labels={SOCIAL_PLATFORMS}
          placeholder="https://instagram.com/you"
          type="url"
          onChange={(items) => set("socials", items)}
        />
      </FormSection>

      <FormSection
        title="Card appearance"
        icon={Palette}
        description="Customize your card colors and layout"
        defaultOpen
      >
        <div className="space-y-5">

          {/* Theme presets */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Theme Presets
            </Label>

            <ThemePicker
              value={value.theme}
              onChange={(theme) => set("theme", theme)}
            />
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label className="text-xs">Accent Color</Label>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.theme.accentColor}
                  onChange={(e) =>
                    set("theme", {
                      ...value.theme,
                      accentColor: e.target.value,
                    })
                  }
                  className="h-10 w-10 rounded border cursor-pointer"
                />

                <Input
                  value={value.theme.accentColor}
                  onChange={(e) =>
                    set("theme", {
                      ...value.theme,
                      accentColor: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Banner Color</Label>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.theme.bannerColor}
                  onChange={(e) =>
                    set("theme", {
                      ...value.theme,
                      bannerColor: e.target.value,
                    })
                  }
                  className="h-10 w-10 rounded border cursor-pointer"
                />

                <Input
                  value={value.theme.bannerColor}
                  onChange={(e) =>
                    set("theme", {
                      ...value.theme,
                      bannerColor: e.target.value,
                    })
                  }
                />
              </div>
            </div>

          </div>

          {/* Layout */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Card Layout
            </Label>

            <LayoutPicker
              value={value.theme.layout}
              accent={value.theme.accentColor}
              onChange={(layout) =>
                set("theme", {
                  ...value.theme,
                  layout,
                })
              }
            />
          </div>

        </div>
      </FormSection>

      <FormSection title="Fonts" icon={Type}>
        <FontPicker value={value.theme.fontPair} onChange={(fontPair) => set("theme", { ...value.theme, fontPair })} />
      </FormSection>

      <FormSection title="Icon style" icon={IdCard}>
        <IconStylePicker value={value.theme.iconStyle} onChange={(iconStyle) => set("theme", { ...value.theme, iconStyle })} />
      </FormSection>

      <FormSection title="Add to Contacts button" icon={IdCard}>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show "Add to Contacts" CTA</Label>
          <Switch checked={value.showAddToContacts} onCheckedChange={(v) => set("showAddToContacts", v)} />
        </div>
      </FormSection>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Preview — renders one of the 4 customer-facing card layouts
// ---------------------------------------------------------------------
export function VCardPreview({ value }: { value: VCardValue }) {
  const layout = value.theme.layout || "classic";
  if (layout === "split") return <SplitLayout value={value} />;
  if (layout === "minimal") return <MinimalLayout value={value} />;
  if (layout === "banner") return <BannerLayout value={value} />;
  return <ClassicLayout value={value} />;
}

function initialsOf(name: string) {
  return (name || "Your Name").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ value, size, accent }: { value: VCardValue; size: number; accent: string }) {
  return (
    <div
      className="rounded-full bg-card border-[3px] border-card shadow-md overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {value.avatarUrl ? (
        <img src={value.avatarUrl} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}26` }}>
          <span className="font-bold" style={{ color: accent, fontSize: size * 0.32 }}>{initialsOf(value.fullName)}</span>
        </div>
      )}
    </div>
  );
}

function SocialRow({ value, accent }: { value: VCardValue; accent: string }) {
  if (!value.socials.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 justify-center px-3">
      {value.socials.slice(0, 6).map((s, i) => {
        const Icon = socialIcon(s.label);
        return (
          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}1a` }} title={s.label}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        );
      })}
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
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

function AddToContactsButton({ value, accent }: { value: VCardValue; accent: string }) {
  if (!value.showAddToContacts) return null;
  return (
    <div className="px-4 pb-3">
      <div className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5" style={{ backgroundColor: accent }}>
        <User className="w-3 h-3 text-white" />
        <span className="text-[11px] font-semibold text-white">Add to Contacts</span>
      </div>
    </div>
  );
}

// --- Layout 1: Classic — banner strip + centered avatar overlap ---
function ClassicLayout({ value }: { value: VCardValue }) {
  const name = value.fullName || "Your Name";
  const banner = value.theme.bannerColor;
  const accent = value.theme.accentColor;

  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="relative px-4 pt-5 pb-12" style={{ background: banner }}>
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.85)" }}>
          {value.company || "Digital Card"}
        </p>
      </div>
      <div className="relative -mt-10 flex justify-center">
        <Avatar value={value} size={68} accent={accent} />
      </div>
      <div className="text-center px-4 mt-2">
        <h3 className="text-[15px] font-bold text-foreground leading-tight">{name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{value.role || (value.company ? "Team Member" : "Your Role")}</p>
      </div>
      <div className="mt-2"><SocialRow value={value} accent={accent} /></div>
      <div className="px-3 mt-3 space-y-1.5 pb-4">
        {value.phones.slice(0, 2).map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {value.emails.slice(0, 2).map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
        {value.phones.length === 0 && value.emails.length === 0 && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-secondary/40">
            <div className="w-7 h-7 rounded-md bg-card" />
            <div className="space-y-1 flex-1">
              <div className="h-1.5 w-10 bg-foreground/10 rounded" />
              <div className="h-2 w-28 bg-foreground/15 rounded" />
            </div>
          </div>
        )}
      </div>
      <AddToContactsButton value={value} accent={accent} />
    </div>
  );
}

// --- Layout 2: Split — thin top strip, left-aligned header row ---
function SplitLayout({ value }: { value: VCardValue }) {
  const name = value.fullName || "Your Name";
  const banner = value.theme.bannerColor;
  const accent = value.theme.accentColor;

  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="h-2" style={{ background: banner }} />
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar value={value} size={52} accent={accent} />
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-foreground leading-tight truncate">{name}</h3>
          <p className="text-[10.5px] text-muted-foreground truncate">{value.role || "Your Role"}{value.company ? ` · ${value.company}` : ""}</p>
        </div>
      </div>
      <div className="px-4"><SocialRow value={value} accent={accent} /></div>
      <div className="px-3 mt-3 grid grid-cols-2 gap-1.5 pb-4">
        {value.phones.slice(0, 2).map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {value.emails.slice(0, 2).map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
      </div>
      <AddToContactsButton value={value} accent={accent} />
    </div>
  );
}

// --- Layout 3: Minimal — no banner, centered & clean ---
function MinimalLayout({ value }: { value: VCardValue }) {
  const name = value.fullName || "Your Name";
  const accent = value.theme.accentColor;

  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex flex-col items-center pt-6 px-4">
        <Avatar value={value} size={72} accent={accent} />
        <h3 className="text-[15px] font-bold text-foreground leading-tight mt-3">{name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{value.role || "Your Role"}</p>
        {value.company && <p className="text-[10px] text-muted-foreground/80">{value.company}</p>}
      </div>
      <div className="mt-3"><SocialRow value={value} accent={accent} /></div>
      <div className="h-px bg-border mx-4 my-3" />
      <div className="px-3 space-y-1.5 pb-4">
        {value.phones.slice(0, 2).map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {value.emails.slice(0, 2).map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
      </div>
      <AddToContactsButton value={value} accent={accent} />
    </div>
  );
}

// --- Layout 4: Bold Banner — full-bleed color, name overlaid on banner ---
function BannerLayout({ value }: { value: VCardValue }) {
  const name = value.fullName || "Your Name";
  const banner = value.theme.bannerColor;
  const accent = value.theme.accentColor;

  return (
    <div className="w-[228px] rounded-xl border border-border bg-background overflow-hidden">
      <div className="relative px-4 pt-5 pb-8 flex items-start justify-between" style={{ background: banner }}>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-tight text-white truncate">{name}</h3>
          <p className="text-[10.5px] text-white/80 mt-0.5 truncate">{value.role || "Your Role"}</p>
          {value.company && <p className="text-[9.5px] text-white/70 truncate">{value.company}</p>}
        </div>
        <Avatar value={value} size={48} accent={accent} />
      </div>
      <div className="mt-3"><SocialRow value={value} accent={accent} /></div>
      <div className="px-3 mt-3 space-y-1.5 pb-4">
        {value.phones.slice(0, 2).map((p, i) => <ContactRow key={`p${i}`} icon={Phone} label={p.label} value={p.value} accent={accent} />)}
        {value.emails.slice(0, 2).map((e, i) => <ContactRow key={`e${i}`} icon={Mail} label={e.label} value={e.value} accent={accent} />)}
      </div>
      <AddToContactsButton value={value} accent={accent} />
    </div>
  );
}
