// components/dashboard-pages/create/components/StepProgress.tsx
"use client";
import { memo } from "react";
import { Check } from "lucide-react";
import { STEPS } from "../create.constants";
import type { StepNumber } from "../create.types";

interface Props {
  step: StepNumber;
  onJump: (n: StepNumber) => void;
}

function StepProgressBase({ step, onJump }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 mb-5">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => (done ? onJump(s.n as StepNumber) : undefined)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${active ? "bg-primary/10" : done ? "hover:bg-secondary cursor-pointer" : ""}`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
                    active ? "bg-primary text-primary-foreground" : done ? "bg-lime text-lime-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                </span>
                <span className={`text-xs font-semibold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-lime" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const StepProgress = memo(StepProgressBase);