// components/qr-builder/forms/types/SocialForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, Share2, User, Palette } from "lucide-react";
import type { SocialValue, SocialProfile } from "@/lib/qr-types/schema";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";

interface Props { value: SocialValue; onChange: (v: SocialValue) => void; errors?: Record<string, string> }

const PLATFORMS = ["Instagram", "X", "LinkedIn", "YouTube", "Facebook", "TikTok", "GitHub", "Website"];
const THEMES: { id: SocialValue["theme"]; label: string; swatch: string }[] = [
  { id: "light", label: "Light", swatch: "#FFFFFF" },
  { id: "dark", label: "Dark", swatch: "#0f0f1a" },
  { id: "gradient", label: "Gradient", swatch: "linear-gradient(135deg,#000099,#7c3aed)" },
];

export default function SocialForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof SocialValue>(k: K, v: SocialValue[K]) => onChange({ ...value, [k]: v });

  // No upload here anymore — just hold the raw File. The actual
  // Cloudinary upload happens once, in CreateContent.tsx's handleSave
  // via uploadPendingFiles(), right before the QR is created.
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("avatarUrl", file as any);
    e.target.value = "";
  };

  // value.avatarUrl may be a real URL string (existing/edited QR) or a
  // raw File (freshly picked, not yet uploaded) — this hook handles both.
  const avatarPreview = useFilePreviewUrl(value.avatarUrl as any);

  const updateProfile = (i: number, patch: Partial<SocialProfile>) =>
    set("profiles", value.profiles.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removeProfile = (i: number) => set("profiles", value.profiles.filter((_, idx) => idx !== i));
  const addProfile = () => set("profiles", [...value.profiles, { platform: PLATFORMS[0], handle: "", url: "" }]);

  return (
    <div className="space-y-3">
      <FormSection title="Profile" icon={User} defaultOpen error={errors?.displayName}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Display name</Label>
            <Input
              value={value.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Your name or brand"
              className={`h-10 ${errorRing(!!errors?.displayName)}`}
            />
            <FieldError message={errors?.displayName} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
            <Textarea value={value.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short bio…" className="min-h-[70px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Avatar</Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/50 border border-border shrink-0 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:border-foreground/30 transition">
                <User className="w-3.5 h-3.5" />
                {avatarPreview ? "Change photo" : "Choose photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarPick}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">Uploaded when you save.</p>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Social links"
        icon={Share2}
        badge={value.profiles.length ? `${value.profiles.length} added` : undefined}
        defaultOpen
        error={errors?.profiles}
      >
        <div className="space-y-2">
          {value.profiles.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={p.platform}
                onChange={(e) => updateProfile(i, { platform: e.target.value })}
                className="h-9 rounded-md border border-border bg-background text-xs px-2 w-28 shrink-0"
              >
                {PLATFORMS.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
              </select>
              <Input
                value={p.url}
                onChange={(e) => updateProfile(i, { url: e.target.value })}
                placeholder="https://instagram.com/you"
                className={`h-9 text-xs flex-1 ${errorRing(!p.url.trim() && Boolean(errors?.profiles))}`}
              />
              <button onClick={() => removeProfile(i)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addProfile}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add profile
          </button>
          <FieldError message={errors?.profiles} />
        </div>
      </FormSection>

      <FormSection title="Theme" icon={Palette}>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set("theme", t.id)}
              className={`flex-1 h-12 rounded-lg border-2 transition ${value.theme === t.id ? "border-foreground scale-95" : "border-border hover:border-foreground/30"}`}
              style={{ background: t.swatch }}
              title={t.label}
            />
          ))}
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function SocialPreview({ value }: { value: SocialValue }) {
  const dark = value.theme === "dark";
  const avatarPreview = useFilePreviewUrl(value.avatarUrl as any);
  return (
    <div
      className="w-[228px] rounded-xl border border-border p-5 flex flex-col items-center gap-3"
      style={{
        background: value.theme === "gradient" ? "linear-gradient(135deg,#000099,#7c3aed)" : dark ? "#0f0f1a" : "#fff",
        color: dark || value.theme === "gradient" ? "#fff" : "#1a1a2e",
      }}
    >
      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
        {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="" /> : <User className="w-7 h-7" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold">{value.displayName || "Your name"}</p>
        <p className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{value.bio || "Your bio goes here"}</p>
      </div>
      <div className="w-full space-y-1.5">
        {(value.profiles.length ? value.profiles : [{ platform: "Instagram", handle: "", url: "" }]).slice(0, 4).map((p, i) => (
          <div key={i} className="w-full py-2 rounded-lg bg-white/15 text-center text-[11px] font-medium">
            {p.platform}
          </div>
        ))}
      </div>
    </div>
  );
}