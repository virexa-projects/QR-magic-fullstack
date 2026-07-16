import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BillingInner } from "@/components/dashboard/billing/BillingInner";

export default function BillingContent() {
  return (
    <DashboardLayout>
      <BillingInner />
    </DashboardLayout>
  );
}