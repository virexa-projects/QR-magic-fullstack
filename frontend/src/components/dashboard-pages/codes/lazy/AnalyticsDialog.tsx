// components/dashboard-pages/codes/lazy/AnalyticsDialog.tsx
"use client";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { QrCode } from "../codes.types";

interface Props {
  qr: QrCode | null;
  onClose: () => void;
}

export default function AnalyticsDialog({ qr, onClose }: Props) {
  const router = useRouter();
  if (!qr) return null;

  return (
    <Dialog open={!!qr} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4.5 h-4.5 text-primary" />
            Quick stats — {qr.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 p-3">
            <div className="text-[11px] text-muted-foreground mb-1">Total scans</div>
            <div className="text-xl font-bold font-heading">{qr.scansTotal.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <div className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Today
            </div>
            <div className="text-xl font-bold font-heading text-success">+{qr.scansToday.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          For the full breakdown by device, location, and time, open the detailed analytics page.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose();
              router.push(`/dashboard/codes/${qr._id}`);
            }}
            className="bg-primary text-primary-foreground gap-1.5"
          >
            Full analytics <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
