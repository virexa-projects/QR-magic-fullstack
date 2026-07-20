// components/dashboard-pages/codes/components/StatsCards.tsx
"use client";
import { QrCode as QrIcon, Zap, TrendingUp } from "lucide-react";
import type { QrCode } from "../codes.types";

interface Props {
  total: number;
  items: QrCode[];
}

export default function StatsCards({ total, items }: Props) {
  const activeOnPage = items.filter((q) => q.status === "active").length;
  const scansToday = items.reduce((sum, q) => sum + (q.scansToday || 0), 0);

  const cards = [
    { label: "Total QR codes", value: total.toLocaleString("en-IN"), icon: QrIcon },
    { label: "Active (this page)", value: activeOnPage.toLocaleString("en-IN"), icon: Zap },
    { label: "Scans today (this page)", value: scansToday.toLocaleString("en-IN"), icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
            <c.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold font-heading text-foreground leading-none">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
