// components/qr-builder/forms/types/AudioForm.tsx
"use client";
import { toast } from "sonner";
import FormSection from "../FormSection";
import FieldError from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Music, Image as ImageIcon } from "lucide-react";
import type { AudioValue } from "@/lib/qr-types/schema";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";

interface Props { value: AudioValue; onChange: (v: AudioValue) => void; errors?: Record<string, string> }

const MAX_AUDIO_MB = 10;
const MAX_IMAGE_MB = 5;

function overLimit(file: File, maxMb: number): boolean {
  if (file.size > maxMb * 1024 * 1024) {
    toast.error(`File is too large — max ${maxMb}MB`);
    return true;
  }
  return false;
}

export default function AudioForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof AudioValue>(k: K, v: AudioValue[K]) => onChange({ ...value, [k]: v });

  const audioPreview = useFilePreviewUrl(value.audioUrl as any);
  const coverPreview = useFilePreviewUrl(value.coverImage as any);

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
                if (overLimit(f, MAX_AUDIO_MB)) {
                  e.target.value = "";
                  return;
                }
                // Hold the raw File — uploaded to Cloudinary on Save, not here.
                set("audioUrl", f as any);
                e.target.value = "";
              }}
              className="text-xs"
            />
            <FieldError message={errors?.audioUrl} />
            <p className="text-[10px] text-muted-foreground">Max {MAX_AUDIO_MB}MB. Uploaded when you save.</p>

            {audioPreview && (
              <audio controls src={audioPreview} className="w-full h-9 mt-1">
                Your browser doesn't support audio playback.
              </audio>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Cover art" icon={ImageIcon}>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (overLimit(f, MAX_IMAGE_MB)) {
                e.target.value = "";
                return;
              }
              set("coverImage", f as any);
              e.target.value = "";
            }}
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Max {MAX_IMAGE_MB}MB.</p>
          {coverPreview && (
            <img src={coverPreview} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
          )}
        </div>
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
  const cover = useFilePreviewUrl(value.coverImage as any);
  const audio = useFilePreviewUrl(value.audioUrl as any);
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-3">
      <div className="w-28 h-28 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
        {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <Music className="w-8 h-8 text-muted-foreground" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{value.title || "Track title"}</p>
        <p className="text-[11px] text-muted-foreground">{value.artist || "Artist"}</p>
      </div>
      {audio ? (
        <audio controls autoPlay={value.autoplay} src={audio} className="w-full h-9">
          Your browser doesn't support audio playback.
        </audio>
      ) : (
        <div className="w-full h-1 bg-secondary rounded-full">
          <div className="h-full w-1/3 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );
}