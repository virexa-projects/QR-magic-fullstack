// components/qr-builder/forms/types/VideoForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Video, Settings } from "lucide-react";
import type { VideoValue } from "@/lib/qr-types/schema";

interface Props { value: VideoValue; onChange: (v: VideoValue) => void; errors?: Record<string, string> }

const SOURCES: { id: VideoValue["source"]; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "vimeo", label: "Vimeo" },
  { id: "upload", label: "Upload file" },
];

export default function VideoForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof VideoValue>(k: K, v: VideoValue[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <FormSection title="Video source" icon={Video} defaultOpen error={errors?.videoUrl}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => set("source", s.id)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                  value.source === s.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {value.source === "upload" ? (
            <div className="space-y-1.5">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  set("videoUrl", URL.createObjectURL(f));
                }}
                className="text-xs"
              />
              <FieldError message={errors?.videoUrl} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {value.source === "youtube" ? "YouTube URL" : "Vimeo URL"}
              </Label>
              <Input
                value={value.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder={value.source === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."}
                className={`h-10 ${errorRing(!!errors?.videoUrl)}`}
              />
              <FieldError message={errors?.videoUrl} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="My video" className="h-10" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Playback options" icon={Settings}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Autoplay</Label>
            <Switch checked={value.autoplay} onCheckedChange={(v) => set("autoplay", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show controls</Label>
            <Switch checked={value.showControls} onCheckedChange={(v) => set("showControls", v)} />
          </div>
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function VideoPreview({ value }: { value: VideoValue }) {
  return (
    <div className="w-[228px] rounded-xl overflow-hidden border border-border bg-card">
      <div className="aspect-video bg-black relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-black ml-0.5" />
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-foreground truncate">{value.title || "Video title"}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{value.source}</p>
      </div>
    </div>
  );
}
