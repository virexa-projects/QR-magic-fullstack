// components/qr-builder/vcard/FontPicker.tsx
"use client";
import { VCARD_FONT_PAIRS, VCardTheme } from "@/lib/qr-types/vcard-theme";

export default function FontPicker({ value, onChange }: { value: VCardTheme["fontPair"]; onChange: (f: VCardTheme["fontPair"]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {VCARD_FONT_PAIRS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`text-left p-3 rounded-lg border transition ${value === f.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-foreground/30"}`}
        >
          <div style={{ fontFamily: f.heading }} className="text-base font-bold text-foreground">{f.label}</div>
          <div style={{ fontFamily: f.body }} className="text-[11px] text-muted-foreground">Aa Bb Cc — sample text</div>
        </button>
      ))}
    </div>
  );
}
