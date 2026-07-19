// components/dashboard-pages/create/components/StepProgress.tsx
"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Check, LayoutGrid, PenLine, Palette } from "lucide-react";
import { STEPS } from "../create.constants";
import type { StepNumber } from "../create.types";

const STEP_ICONS = [LayoutGrid, PenLine, Palette] as const;
const STEP_HINTS = [
  "What should this QR do?",
  "Fill in your details",
  "Style & save",
] as const;

interface Props {
  step: StepNumber;
  onJump: (n: StepNumber) => void;
}

function StepProgressBase({ step, onJump }: Props) {
  return (
    <div className="relative mb-8">
      {/* ── Desktop stepper ─────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-start">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          const active = step === s.n;
          const done = step > s.n;
          const upcoming = step < s.n;

          return (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              {/* circle + labels */}
              <button
                type="button"
                onClick={() => (done ? onJump(s.n as StepNumber) : undefined)}
                disabled={upcoming}
                className={`group flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? "bg-primary/[0.07]"
                    : done
                    ? "hover:bg-secondary/60 cursor-pointer"
                    : "opacity-50 cursor-default"
                }`}
              >
                {/* icon circle */}
                <span
                  className={`relative grid place-items-center w-11 h-11 rounded-xl text-sm font-bold transition-all duration-300 shrink-0 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(0,0,153,0.25)]"
                      : done
                      ? "bg-lime text-lime-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-[18px] h-[18px]" /> : <Icon className="w-[18px] h-[18px]" />}
                  {/* pulsing ring on active */}
                  {active && (
                    <motion.span
                      className="absolute inset-0 rounded-xl ring-[2.5px] ring-primary/25"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </span>

                {/* text */}
                <div className="text-left min-w-0">
                  <div
                    className={`text-[13px] font-semibold leading-tight transition-colors ${
                      active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {STEP_HINTS[i]}
                  </div>
                </div>
              </button>

              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1 h-[2px] rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-lime"
                    initial={false}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile stepper (compact pill) ───────────────────────────────── */}
      <div className="flex sm:hidden items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const done = step > s.n;

          return (
            <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => (done ? onJump(s.n as StepNumber) : undefined)}
                className="flex items-center gap-2"
              >
                <span
                  className={`grid place-items-center w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-lime text-lime-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                </span>
                {active && (
                  <span className="text-xs font-semibold text-primary">{s.label}</span>
                )}
              </button>

              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-lime"
                    initial={false}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const StepProgress = memo(StepProgressBase);