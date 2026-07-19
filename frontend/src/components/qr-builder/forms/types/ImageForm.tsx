// components/qr-builder/forms/types/ImageForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, X, LayoutGrid } from "lucide-react";
import type { ImageValue } from "@/lib/qr-types/schema";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";

interface Props { value: ImageValue; onChange: (v: ImageValue) => void; errors?: Record<string, string> }

const LAYOUTS: { id: ImageValue["layout"]; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "carousel", label: "Carousel" },
  { id: "stack", label: "Stack" },
];

export default function ImageForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof ImageValue>(k: K, v: ImageValue[K]) => onChange({ ...value, [k]: v });

  // No FileReader/base64 anymore — just hold the raw File. Nothing hits
  // the network until the user clicks Save, at which point
  // uploadPendingFiles() in CreateContent.tsx walks this array and
  // swaps each File for its Cloudinary URL.
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newEntries = Array.from(files).map((f) => ({ url: f as any, caption: "" }));
    set("images", [...value.images, ...newEntries]);
  };

  const removeImage = (i: number) => set("images", value.images.filter((_, idx) => idx !== i));
  const updateCaption = (i: number, caption: string) =>
    set("images", value.images.map((img, idx) => (idx === i ? { ...img, caption } : img)));

  return (
    <div className="space-y-3">
      <FormSection title="Images" icon={ImageIcon} badge={value.images.length ? `${value.images.length} added` : undefined} defaultOpen error={errors?.images}>
        <div className="space-y-3">
          <input type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="text-xs" />
          <FieldError message={errors?.images} />
          {value.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {value.images.map((img, i) => (
                <ImageThumb key={i} img={img} onCaption={(c) => updateCaption(i, c)} onRemove={() => removeImage(i)} />
              ))}
            </div>
          )}
        </div>
      </FormSection>

      <FormSection title="Gallery details" icon={LayoutGrid}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="My gallery" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Layout</Label>
            <div className="flex gap-2">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => set("layout", l.id)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                    value.layout === l.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}

function ImageThumb({ img, onCaption, onRemove }: { img: { url: any; caption?: string }; onCaption: (c: string) => void; onRemove: () => void }) {
  const preview = useFilePreviewUrl(img.url);
  return (
    <div className="relative rounded-lg border border-border overflow-hidden">
      <img src={preview} className="w-full h-20 object-cover" alt="" />
      <button onClick={onRemove} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
        <X className="w-3 h-3 text-white" />
      </button>
      <input
        value={img.caption || ""}
        onChange={(e) => onCaption(e.target.value)}
        placeholder="Caption"
        className="w-full text-[10px] px-1.5 py-1 bg-background border-t border-border"
      />
    </div>
  );
}

// --- Preview ---
export function ImagePreview({ value }: { value: ImageValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <p className="text-xs font-semibold text-foreground truncate">{value.title || "Image gallery"}</p>
      </div>
      {value.images.length ? (
        <div className={`p-2 grid gap-1.5 ${value.layout === "grid" ? "grid-cols-2" : "grid-cols-1"}`}>
          {value.images.slice(0, value.layout === "grid" ? 4 : 2).map((img, i) => (
            <PreviewThumb key={i} url={img.url as any} />
          ))}
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-[10px]">No images yet</p>
        </div>
      )}
    </div>
  );
}

function PreviewThumb({ url }: { url: any }) {
  const preview = useFilePreviewUrl(url);
  return <img src={preview} className="w-full h-20 object-cover rounded-md" alt="" />;
}