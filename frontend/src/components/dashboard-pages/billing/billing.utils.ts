import { PLAN_TIER_ORDER } from "./billing.constants";

export function tierRankOf(slugOrId?: string | null): number {
  if (!slugOrId) return 0;
  const key = slugOrId.toLowerCase();
  return key in PLAN_TIER_ORDER ? PLAN_TIER_ORDER[key] : 0;
}

export function planKey(plan: { slug?: string; _id: string }): string {
  return (plan.slug ?? plan._id ?? "").toLowerCase();
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function daysRemaining(iso?: string) {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function statusBadgeClasses(status?: string) {
  switch (status) {
    case "active":
      return "bg-emerald/10 text-emerald border-emerald/30";
    case "expired":
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "pending":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-secondary text-muted-foreground border-border/60";
  }
}
