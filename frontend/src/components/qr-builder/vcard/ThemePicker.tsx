// components/qr-builder/vcard/ThemePicker.tsx
"use client";
import { VCARD_THEMES, VCardTheme } from "@/lib/qr-types/vcard-theme";
import { Label } from "@/components/ui/label";

export default function ThemePicker({ value, onChange }: { value: VCardTheme; onChange: (t: VCardTheme) => void }) {
  const isCustom = value.themeId === "custom";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {VCARD_THEMES.map((t) => {
          const selected = value.themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                onChange(
                  t.id === "custom"
                    ? { ...value, themeId: t.id } // keep whatever custom colors were already picked
                    : { ...value, themeId: t.id, bannerColor: t.banner, accentColor: t.accent }
                )
              }
              className="flex flex-col items-center gap-1 group"
              title={t.label}
            >
              <span
                className={`block w-full aspect-square rounded-xl border-2 transition ${
                  selected ? "border-foreground scale-95" : "border-border group-hover:border-foreground/30"
                }`}
                style={{ background: t.swatch }}
              />
              <span className={`text-[9.5px] font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {isCustom && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Header banner</Label>
            <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
              <input
                type="color"
                value={/^#/.test(value.bannerColor) ? value.bannerColor : "#000099"}
                onChange={(e) => onChange({ ...value, bannerColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs font-mono text-foreground">{value.bannerColor.toUpperCase()}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Accent (buttons)</Label>
            <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
              <input
                type="color"
                value={/^#/.test(value.accentColor) ? value.accentColor : "#000099"}
                onChange={(e) => onChange({ ...value, accentColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs font-mono text-foreground">{value.accentColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
