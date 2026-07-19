// components/dashboard-pages/create/components/StepNavigation.tsx
"use client";
import { memo } from "react";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
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
  return (
    <div className="sticky bottom-0 z-30 mt-6 -mx-4 sm:mx-0 px-4 sm:px-5 py-3 flex items-center gap-3 bg-card/95 backdrop-blur border-t border-border sm:border sm:rounded-xl shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.08)] sm:shadow-none">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={step === 1}
        className="flex-1 sm:flex-none h-11 gap-1.5 justify-center text-foreground disabled:opacity-30"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="hidden sm:block flex-1 text-center text-[11px] font-medium text-muted-foreground">
        Step {step} of 3 — {STEPS[step - 1].label}
      </div>

      {step < 3 ? (
        <Button onClick={onNext} className="flex-1 sm:flex-none h-11 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 justify-center">
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button onClick={onSave} disabled={actionLoading} className="w-1/4 h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          <Save className="w-4 h-4 mr-2" /> {actionLoading ? "Saving…" : "Save to library"}
        </Button>
      )}
    </div>
  );
}

export const StepNavigation = memo(StepNavigationBase);