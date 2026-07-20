// components/dashboard-pages/codes/components/CodeCard.tsx
"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import StyledQrPreview from "@/components/dashboard/StyledQrPreview";
import StatusBadge from "./StatusBadge";
import DownloadMenu from "./DownloadMenu";
import { RowActionsMenu } from "./CodeRow";
import type { QrCode, QRDesign } from "../codes.types";
import { typeColors, defaultDesign } from "../codes.constants";
import { formatCreatedDate } from "../codes.utils";

interface Props {
  q: QrCode;
  index: number;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (q: QrCode) => void;
  onEdit: (q: QrCode) => void;
  onDesign: (q: QrCode) => void;
  onToggleStatus: (q: QrCode) => void;
  onDelete: (q: QrCode) => void;
  onAnalytics: (q: QrCode) => void;
  onShare: (q: QrCode) => void;
  actionLoading: boolean;
}

export default function CodeCard({ q, index, selected, onToggleSelect, onPreview, onEdit, onDesign, onToggleStatus, onDelete, onAnalytics, onShare, actionLoading }: Props) {
  const router = useRouter();
  const design: QRDesign = q.design ?? defaultDesign;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => router.push(`/dashboard/codes/${q._id}`)}
      className={`relative rounded-2xl border bg-card p-4 shadow-card hover:shadow-md transition cursor-pointer group ${
        selected ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60"
      }`}
    >
      <div className="absolute top-3 left-3 z-10" onClick={stop}>
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(q._id)} aria-label={`Select ${q.name}`} />
      </div>

      <div className="absolute top-3 right-3 z-10" onClick={stop}>
        <RowActionsMenu q={q} design={design} onEdit={onEdit} onDesign={onDesign} onToggleStatus={onToggleStatus} onDelete={onDelete} onAnalytics={onAnalytics} onShare={onShare} />
      </div>

      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          title="Click to preview"
          onClick={(e) => {
            stop(e);
            onPreview(q);
          }}
          className="p-1.5 rounded-lg border border-border bg-white hover:border-primary/50 hover:shadow-sm transition"
        >
          <StyledQrPreview value={q.shortUrl} design={design} size={110} />
        </button>

        <div className="w-full text-center">
          <Badge className={`${typeColors[q.type] ?? "bg-secondary text-foreground"} border-0 font-semibold uppercase text-[9px] mb-1`}>{q.type}</Badge>
          <div className="font-semibold text-foreground group-hover:text-primary transition text-sm truncate">{q.name}</div>
          <div className="text-[10px] text-muted-foreground">Created {formatCreatedDate(q.createdAt)}</div>
        </div>

        <div className="flex items-center gap-2 max-w-full">
          <span className="text-foreground truncate text-xs font-mono max-w-[140px]">{q.destination}</span>
          {q.isDynamic ? (
            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary shrink-0">DYNAMIC</Badge>
          ) : (
            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between w-full pt-2 border-t border-border/60" onClick={stop}>
          <div>
            <div className="font-bold font-heading text-sm">{q.scansTotal.toLocaleString("en-IN")} scans</div>
            {q.scansToday > 0 && <div className="text-[10px] text-success font-semibold">+{q.scansToday} today</div>}
          </div>
          <StatusBadge status={q.status} disabled={actionLoading} onToggle={() => onToggleStatus(q)} />
        </div>

        <div className="w-full" onClick={stop}>
          <DownloadMenu qr={q} design={design} />
        </div>
      </div>
    </motion.div>
  );
}
