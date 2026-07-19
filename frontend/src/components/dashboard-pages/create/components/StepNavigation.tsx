// components/dashboard-pages/create/components/StepNavigation.tsx
"use client";
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEPS } from "../create.constants";
import type { StepNumber } from "../create.types";

interface Props {
  step: StepNumber;
  actionLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}

function StepNavigationBase({ step, actionLoading, onBack, onNext, onSave }: Props) {
  const isFirst = step === 1;
  const isLast = step === 3;

  return (
    <motion.div
      layout
      className="mb-4 flex items-center gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm"
    >
      {/* ── Back button ─────────────────────────────────────── */}
      <AnimatePresence>
        {!isFirst && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="outline"
              onClick={onBack}
              className="h-11 gap-2 px-5 rounded-xl text-foreground border-border hover:bg-secondary/80"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center: step indicator ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s.n === step
                  ? "w-8 bg-primary"
                  : s.n < step
                  ? "w-4 bg-lime"
                  : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Primary action ──────────────────────────────────── */}
      {isLast ? (
        <Button
          onClick={onSave}
          disabled={actionLoading}
          className="h-11 gap-2 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_16px_rgba(0,0,153,0.25)] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,153,0.35)]"
        >
          {actionLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Save to Library
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="h-11 gap-2 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_16px_rgba(0,0,153,0.25)] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,153,0.35)]"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

export const StepNavigation = memo(StepNavigationBase);