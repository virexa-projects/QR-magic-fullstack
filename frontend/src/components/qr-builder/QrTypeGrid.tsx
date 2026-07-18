// components/qr-builder/QrTypeGrid.tsx
"use client";
import { motion } from "framer-motion";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import type { QrTypeId } from "@/lib/qr-types/schema";

const CATEGORY_LABELS: Record<string, string> = {
  classic: "Classic",
  business: "Business",
  media: "Media",
  engagement: "Engagement",
};
const CATEGORY_ORDER = ["classic", "business", "media", "engagement"];

interface Props {
  selected: QrTypeId;
  onSelect: (id: QrTypeId) => void;
}

export default function QrTypeGrid({ selected, onSelect }: Props) {
  const grouped = Object.values(QR_TYPE_REGISTRY).reduce<Record<string, (typeof QR_TYPE_REGISTRY)[QrTypeId][]>>(
    (acc, def) => {
      (acc[def.category] ??= []).push(def);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-6">
      <div>
        <h2 className="text-base font-bold text-foreground">Pick a QR type</h2>
        <p className="text-xs text-muted-foreground mt-0.5">What should happen when someone scans?</p>
      </div>

      {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((category) => (
        <div key={category}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {CATEGORY_LABELS[category] ?? category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {grouped[category].map((def, i) => {
              const Icon = def.icon;
              const sel = selected === def.id;
              return (
                <motion.button
                  key={def.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelect(def.id)}
                  className={`relative text-left rounded-xl border p-3 transition-all ${
                    sel ? "bg-primary/5 border-primary ring-1 ring-primary/30" : "bg-background border-border hover:border-foreground/30"
                  }`}
                >
                  {def.popular && !sel && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-lime text-lime-foreground">
                      Popular
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sel ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`text-sm font-semibold ${sel ? "text-primary" : "text-foreground"}`}>{def.label}</div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">{def.description}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
