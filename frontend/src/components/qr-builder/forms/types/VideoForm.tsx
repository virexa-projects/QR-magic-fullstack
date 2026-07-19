// components/qr-builder/forms/types/VideoForm.tsx
"use client";
import { toast } from "sonner";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Video, Settings } from "lucide-react";
import type { VideoValue } from "@/lib/qr-types/schema";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";

interface Props { value: VideoValue; onChange: (v: VideoValue) => void; errors?: Record<string, string> }

const SOURCES: { id: VideoValue["source"]; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "vimeo", label: "Vimeo" },
  { id: "upload", label: "Upload file" },
];

const MAX_VIDEO_MB = 10;

function overLimit(file: File, maxMb: number): boolean {
  if (file.size > maxMb * 1024 * 1024) {
    toast.error(`File is too large — max ${maxMb}MB`);
    return true;
  }
  return false;
}

// Best-effort embed URL builder for YouTube/Vimeo links so the form
// preview can actually play them, not just show a static placeholder.
function toEmbedUrl(source: VideoValue["source"], url: string): string | null {
  if (!url) return null;
  try {
    if (source === "youtube") {
      const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      const id = idMatch?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (source === "vimeo") {
      const idMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const id = idMatch?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function VideoForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof VideoValue>(k: K, v: VideoValue[K]) => onChange({ ...value, [k]: v });

  const videoPreview = useFilePreviewUrl(value.videoUrl as any);
  const isUploadedFileUrl = typeof value.videoUrl !== "string" || value.videoUrl.startsWith("blob:") || value.videoUrl.includes("res.cloudinary.com");
  const embedUrl = value.source !== "upload" && typeof value.videoUrl === "string" ? toEmbedUrl(value.source, value.videoUrl) : null;

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
                  if (overLimit(f, MAX_VIDEO_MB)) {
                    e.target.value = "";
                    return;
                  }
                  // Raw File held until Save — uploaded to Cloudinary at submit time.
                  set("videoUrl", f as any);
                  e.target.value = "";
                }}
                className="text-xs"
              />
              <FieldError message={errors?.videoUrl} />
              <p className="text-[10px] text-muted-foreground">Max {MAX_VIDEO_MB}MB. Uploaded when you save.</p>

              {videoPreview && (
                <video controls src={videoPreview} className="w-full rounded-lg mt-1 max-h-48 bg-black">
                  Your browser doesn't support video playback.
                </video>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {value.source === "youtube" ? "YouTube URL" : "Vimeo URL"}
              </Label>
              <Input
                value={typeof value.videoUrl === "string" ? value.videoUrl : ""}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder={value.source === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."}
                className={`h-10 ${errorRing(!!errors?.videoUrl)}`}
              />
              <FieldError message={errors?.videoUrl} />

              {embedUrl && (
                <div className="mt-1 aspect-video rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
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

// --- Preview — plays the actual file/embed instead of a static placeholder ---
export function VideoPreview({ value }: { value: VideoValue }) {
  const videoPreview = useFilePreviewUrl(value.videoUrl as any);
  const embedUrl = value.source !== "upload" && typeof value.videoUrl === "string" ? toEmbedUrl(value.source, value.videoUrl) : null;

  return (
    <div className="w-[228px] rounded-xl overflow-hidden border border-border bg-card">
      <div className="aspect-video bg-black relative flex items-center justify-center">
        {value.source === "upload" && videoPreview ? (
          <video
            controls={value.showControls}
            autoPlay={value.autoplay}
            muted={value.autoplay}
            src={videoPreview}
            className="w-full h-full object-cover"
          />
        ) : embedUrl ? (
          <iframe
            src={`${embedUrl}${value.autoplay ? (embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1") : ""}`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-black ml-0.5" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-foreground truncate">{value.title || "Video title"}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{value.source}</p>
      </div>
    </div>
  );
}