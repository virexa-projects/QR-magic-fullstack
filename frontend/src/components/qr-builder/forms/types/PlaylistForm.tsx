// components/qr-builder/forms/types/PlaylistForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListMusic, Image as ImageIcon } from "lucide-react";
import type { PlaylistValue } from "@/lib/qr-types/schema";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";

interface Props { value: PlaylistValue; onChange: (v: PlaylistValue) => void; errors?: Record<string, string> }

const PLATFORMS: { id: PlaylistValue["platform"]; label: string }[] = [
  { id: "spotify", label: "Spotify" },
  { id: "apple-music", label: "Apple Music" },
  { id: "youtube", label: "YouTube" },
  { id: "soundcloud", label: "SoundCloud" },
];

export default function PlaylistForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof PlaylistValue>(k: K, v: PlaylistValue[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <FormSection title="Playlist" icon={ListMusic} defaultOpen error={errors?.playlistUrl}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set("platform", p.id)}
                className={`py-2 rounded-lg border text-xs font-medium transition ${
                  value.platform === p.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Playlist URL</Label>
            <Input
              value={value.playlistUrl}
              onChange={(e) => set("playlistUrl", e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className={`h-10 ${errorRing(!!errors?.playlistUrl)}`}
            />
            <FieldError message={errors?.playlistUrl} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="My playlist" className="h-10" />
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
            set("coverImage", f as any);
            e.target.value = "";
          }}
          className="text-xs"
        />
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function PlaylistPreview({ value }: { value: PlaylistValue }) {
  const cover = useFilePreviewUrl(value.coverImage as any);
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-3">
      <div className="w-28 h-28 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
        {cover ? <img src={cover} className="w-full h-full object-cover" alt="" /> : <ListMusic className="w-8 h-8 text-muted-foreground" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{value.title || "Playlist title"}</p>
        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{value.platform.replace("-", " ")}</p>
      </div>
      <div className="w-full h-8 rounded-full bg-primary flex items-center justify-center">
        <span className="text-[11px] text-primary-foreground font-medium">Play on {PLATFORMS.find((p) => p.id === value.platform)?.label}</span>
      </div>
    </div>
  );
}