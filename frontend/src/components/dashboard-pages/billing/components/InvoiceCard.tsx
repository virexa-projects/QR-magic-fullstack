import { memo } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "../billing.utils";
import type { ActiveSubscription } from "../billing.types";

interface InvoiceCardProps {
  activeSubscription: ActiveSubscription | null;
}

function InvoiceCardBase({ activeSubscription }: InvoiceCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold font-heading text-foreground">Invoices</h3>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
          View all
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {activeSubscription
          ? `Payment ID ${activeSubscription.paymentId ?? "—"} · ${formatDate(activeSubscription.createdAt)}`
          : "No invoices yet. They'll appear here after your first payment."}
      </p>
    </div>
  );
}

export const InvoiceCard = memo(InvoiceCardBase);
