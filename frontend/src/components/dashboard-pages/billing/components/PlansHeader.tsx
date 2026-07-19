import { memo } from "react";

interface PlansHeaderProps {
  hasRealPlans: boolean;
}

function PlansHeaderBase({ hasRealPlans }: PlansHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold font-heading text-foreground">Choose the right plan</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hasRealPlans
            ? "Upgrade anytime — takes effect immediately. Downgrades take effect at the end of your current billing period."
            : "Loading plans from the server…"}
        </p>
      </div>
    </div>
  );
}

export const PlansHeader = memo(PlansHeaderBase);
