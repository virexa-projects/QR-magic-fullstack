import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { ActiveSubscription } from "../billing.types";

interface PaymentMethodCardProps {
  activeSubscription: ActiveSubscription | null;
}

function PaymentMethodCardBase({ activeSubscription }: PaymentMethodCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold font-heading text-foreground">Payment method</h3>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
          Add card
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {activeSubscription
          ? `Last charged via ${activeSubscription.paymentGateway}. Add a card to enable auto-renewal.`
          : "No card on file. Add a payment method to enable auto-renewal."}
      </p>
    </div>
  );
}

export const PaymentMethodCard = memo(PaymentMethodCardBase);
