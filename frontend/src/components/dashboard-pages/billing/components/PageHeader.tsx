import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClasses } from "../billing.utils";
import type { ActiveSubscription } from "../billing.types";

interface PageHeaderProps {
  activeSubscription: ActiveSubscription | null;
  currentPlanName: string;
}

function PageHeaderBase({ activeSubscription, currentPlanName }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-[28px] font-bold font-heading text-foreground tracking-tight">
          Plan & billing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription, usage and invoices.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {activeSubscription && (
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusBadgeClasses(
              activeSubscription.status
            )}`}
          >
            {activeSubscription.status}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-[11px] font-semibold bg-secondary border-border/60 text-muted-foreground uppercase tracking-wider"
        >
          Current plan · {currentPlanName}
        </Badge>
      </div>
    </div>
  );
}

export const PageHeader = memo(PageHeaderBase);
