// components/qr-builder/forms/types/UrlForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon } from "lucide-react";
import type { UrlValue } from "@/lib/qr-types/schema";

interface Props { value: UrlValue; onChange: (v: UrlValue) => void; errors?: Record<string, string> }

export default function UrlForm({ value, onChange, errors }: Props) {
  return (
    <FormSection title="Destination" icon={LinkIcon} defaultOpen error={errors?.url}>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Website URL</Label>
        <Input
          type="url"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          placeholder="https://yourwebsite.com"
          className={`h-10 ${errorRing(!!errors?.url)}`}
        />
        <FieldError message={errors?.url} />
      </div>
    </FormSection>
  );
}

// --- Preview ---
export function UrlPreview({ value }: { value: UrlValue }) {
  const domain = (value.url || "yourwebsite.com").replace(/https?:\/\//, "").split("/")[0];
  return (
    <div className="w-[228px] rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-b border-border/30">
        <div className="flex-1 bg-background rounded-md px-2 py-1">
          <p className="text-[10px] text-muted-foreground truncate">{domain}</p>
        </div>
      </div>
      <div className="p-4 space-y-2 bg-card">
        <div className="h-16 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded bg-primary/30" />
        </div>
        <div className="h-2.5 bg-foreground/10 rounded w-3/4" />
        <div className="h-2 bg-foreground/5 rounded w-full" />
      </div>
    </div>
  );
}
