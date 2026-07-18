// components/qr-builder/forms/FormSection.tsx
"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  description?: string;
  icon?: React.ElementType;
  defaultOpen?: boolean;
  badge?: string; // e.g. "3 added"
  error?: string; // shows a red dot + tints the header when a field inside has an error
  children: React.ReactNode;
}

export default function FormSection({ title, description, icon: Icon, defaultOpen = false, badge, error, children }: Props) {
  const [open, setOpen] = useState(defaultOpen || Boolean(error));

  return (
    <div className={`border rounded-xl overflow-hidden bg-card ${error ? "border-destructive/40" : "border-border"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition"
      >
        <div className="flex items-center gap-2.5 text-left">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{badge}</span>
              )}
              {error && <span className="w-1.5 h-1.5 rounded-full bg-destructive" title={error} />}
            </div>
            {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/60">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
