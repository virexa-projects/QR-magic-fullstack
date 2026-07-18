// components/qr-builder/forms/types/AudioForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Music, Image as ImageIcon } from "lucide-react";
import type { AudioValue } from "@/lib/qr-types/schema";

interface Props { value: AudioValue; onChange: (v: AudioValue) => void; errors?: Record<string, string> }

export default function AudioForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof AudioValue>(k: K, v: AudioValue[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <FormSection title="Track info" icon={Music} defaultOpen error={errors?.title || errors?.audioUrl}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Track name" className="h-10" />
            <FieldError message={errors?.title} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Artist</Label>
            <Input value={value.artist} onChange={(e) => set("artist", e.target.value)} placeholder="Artist name" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Audio file</Label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                set("audioUrl", URL.createObjectURL(f));
              }}
              className="text-xs"
            />
            <FieldError message={errors?.audioUrl} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Cover art" icon={ImageIcon}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => set("coverImage", r.result as string);
            r.readAsDataURL(f);
          }}
          className="text-xs"
        />
      </FormSection>

      <FormSection title="Playback" icon={Music}>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Autoplay on open</Label>
          <Switch checked={value.autoplay} onCheckedChange={(v) => set("autoplay", v)} />
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function AudioPreview({ value }: { value: AudioValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-3">
      <div className="w-28 h-28 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
        {value.coverImage ? (
          <img src={value.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{value.title || "Track title"}</p>
        <p className="text-[11px] text-muted-foreground">{value.artist || "Artist"}</p>
      </div>
      <div className="w-full h-1 bg-secondary rounded-full">
        <div className="h-full w-1/3 bg-primary rounded-full" />
      </div>
    </div>
  );
}
