import { Globe, Link2, Plus, X } from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaXTwitter, FaYoutube, FaGithub, FaFacebookF, FaTiktok } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SocialItem = { label: string; value: string };

const PLATFORMS: { id: string; label: string; icon: React.ElementType; placeholder: string; brand: string }[] = [
  { id: "LinkedIn",  label: "LinkedIn",  icon: FaLinkedinIn, placeholder: "https://linkedin.com/in/username", brand: "#0A66C2" },
  { id: "Instagram", label: "Instagram", icon: FaInstagram,  placeholder: "https://instagram.com/username",   brand: "#E4405F" },
  { id: "X",         label: "X",         icon: FaXTwitter,   placeholder: "https://x.com/username",            brand: "#000000" },
  { id: "YouTube",   label: "YouTube",   icon: FaYoutube,    placeholder: "https://youtube.com/@channel",      brand: "#FF0000" },
  { id: "Facebook",  label: "Facebook",  icon: FaFacebookF,  placeholder: "https://facebook.com/username",     brand: "#1877F2" },
  { id: "TikTok",    label: "TikTok",    icon: FaTiktok,     placeholder: "https://tiktok.com/@username",      brand: "#000000" },
  { id: "GitHub",    label: "GitHub",    icon: FaGithub,     placeholder: "https://github.com/username",       brand: "#181717" },
  { id: "Website",   label: "Website",   icon: Globe,        placeholder: "https://yourwebsite.com",           brand: "#1a1a2e" },
  { id: "Custom",    label: "Custom",    icon: Link2,        placeholder: "https://...",                        brand: "#475569" },
];

function getPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[PLATFORMS.length - 1];
}

interface Props {
  items: SocialItem[];
  onChange: (items: SocialItem[]) => void;
}

export default function SocialPicker({ items, onChange }: Props) {
  const add = (label: string) => onChange([...items, { label, value: "" }]);
  const update = (i: number, value: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, value } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground">Social & links</Label>
        <span className="text-[10px] text-muted-foreground">Tap an icon to add</span>
      </div>

      {/* Icon palette */}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-dashed border-border bg-secondary/30">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p.id)}
              title={`Add ${p.label}`}
              className="group relative w-9 h-9 rounded-md bg-card border border-border flex items-center justify-center hover:border-primary hover:bg-primary-soft transition"
            >
              <Icon className="w-4 h-4 text-foreground group-hover:text-primary" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-lime text-lime-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Plus className="w-2.5 h-2.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Added rows */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((it, i) => {
            const p = getPlatform(it.label);
            const Icon = p.icon;
            return (
              <div key={i} className="flex gap-1.5 items-center">
                <div
                  className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 border border-border"
                  style={{ backgroundColor: `${p.brand}12` }}
                  title={p.label}
                >
                  <Icon className="w-4 h-4" style={{ color: p.brand }} />
                </div>
                <Input
                  placeholder={p.placeholder}
                  value={it.value}
                  onChange={(e) => update(i, e.target.value)}
                  className="h-9 flex-1 bg-background"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
