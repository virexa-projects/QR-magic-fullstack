// components/qr-builder/vcard/IconStylePicker.tsx
"use client";
import { VCardTheme } from "@/lib/qr-types/vcard-theme";

const STYLES: { id: VCardTheme["iconStyle"]; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "filled", label: "Filled" },
  { id: "duotone", label: "Duotone" },
];

export default function IconStylePicker({ value, onChange }: { value: VCardTheme["iconStyle"]; onChange: (s: VCardTheme["iconStyle"]) => void }) {
  return (
    <div className="flex gap-2">
      {STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${value === s.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
