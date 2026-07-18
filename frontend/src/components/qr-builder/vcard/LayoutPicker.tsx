// components/qr-builder/vcard/LayoutPicker.tsx
"use client";
import { VCARD_LAYOUTS, VCardTheme } from "@/lib/qr-types/vcard-theme";

// Tiny inline thumbnails so the user can tell the 4 layouts apart at a glance
// without needing to flip the full phone preview back and forth.
function Thumb({ id, accent }: { id: VCardTheme["layout"]; accent: string }) {
  switch (id) {
    case "classic":
      return (
        <svg viewBox="0 0 64 48" className="w-full h-full">
          <rect width="64" height="18" fill={accent} opacity={0.85} />
          <circle cx="32" cy="20" r="7" fill="white" stroke={accent} strokeWidth="1.5" />
          <rect x="20" y="30" width="24" height="3" rx="1.5" fill="currentColor" opacity={0.7} />
          <rect x="14" y="36" width="36" height="3" rx="1.5" fill="currentColor" opacity={0.3} />
          <rect x="14" y="41" width="36" height="3" rx="1.5" fill="currentColor" opacity={0.3} />
        </svg>
      );
    case "split":
      return (
        <svg viewBox="0 0 64 48" className="w-full h-full">
          <rect width="64" height="6" fill={accent} />
          <circle cx="12" cy="18" r="6" fill={accent} opacity={0.85} />
          <rect x="22" y="14" width="26" height="3" rx="1.5" fill="currentColor" opacity={0.7} />
          <rect x="22" y="20" width="18" height="2.5" rx="1.25" fill="currentColor" opacity={0.4} />
          <rect x="6" y="30" width="24" height="12" rx="2" fill="currentColor" opacity={0.12} />
          <rect x="34" y="30" width="24" height="12" rx="2" fill="currentColor" opacity={0.12} />
        </svg>
      );
    case "minimal":
      return (
        <svg viewBox="0 0 64 48" className="w-full h-full">
          <circle cx="32" cy="12" r="7" fill="currentColor" opacity={0.12} stroke={accent} strokeWidth="1.5" />
          <rect x="20" y="24" width="24" height="3" rx="1.5" fill="currentColor" opacity={0.7} />
          <rect x="16" y="30" width="32" height="1" fill="currentColor" opacity={0.2} />
          <rect x="18" y="35" width="28" height="3" rx="1.5" fill="currentColor" opacity={0.3} />
          <rect x="18" y="40" width="28" height="3" rx="1.5" fill="currentColor" opacity={0.3} />
        </svg>
      );
    case "banner":
      return (
        <svg viewBox="0 0 64 48" className="w-full h-full">
          <rect width="64" height="30" fill={accent} opacity={0.9} />
          <rect x="6" y="8" width="26" height="3" rx="1.5" fill="white" opacity={0.95} />
          <rect x="6" y="14" width="18" height="2.5" rx="1.25" fill="white" opacity={0.7} />
          <circle cx="52" cy="24" r="7" fill="white" stroke={accent} strokeWidth="1.5" />
          <rect x="10" y="36" width="44" height="3" rx="1.5" fill="currentColor" opacity={0.3} />
        </svg>
      );
  }
}

export default function LayoutPicker({
  value,
  accent,
  onChange,
}: {
  value: VCardTheme["layout"];
  accent: string;
  onChange: (l: VCardTheme["layout"]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {VCARD_LAYOUTS.map((l) => {
        const selected = value === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            className={`text-left rounded-lg border-2 overflow-hidden transition ${
              selected ? "border-foreground" : "border-border hover:border-foreground/30"
            }`}
          >
            <div className="bg-secondary/30 text-foreground h-[68px] p-2">
              <Thumb id={l.id} accent={accent} />
            </div>
            <div className={`px-2.5 py-2 ${selected ? "bg-foreground text-background" : "bg-card"}`}>
              <p className="text-[11px] font-semibold leading-none">{l.label}</p>
              <p className={`text-[9.5px] mt-1 leading-tight ${selected ? "text-background/70" : "text-muted-foreground"}`}>
                {l.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
