// components/dashboard-pages/codes/components/CodeRow.tsx
"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, Palette, BarChart3, ExternalLink, Trash2, MoreHorizontal, Lock, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import StyledQrPreview from "@/components/dashboard/StyledQrPreview";
import StatusBadge from "./StatusBadge";
import DownloadMenu from "./DownloadMenu";
import ShareMenu from "./ShareMenu";
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

export default function CodeRow({ q, index, selected, onToggleSelect, onPreview, onEdit, onDesign, onToggleStatus, onDelete, onAnalytics, onShare, actionLoading }: Props) {
  const router = useRouter();
  const design: QRDesign = q.design ?? defaultDesign;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => router.push(`/dashboard/codes/${q._id}`)}
      className={`border-t border-border/60 hover:bg-secondary/40 transition cursor-pointer group ${selected ? "bg-primary-soft/40" : ""}`}
    >
      <td className="pl-5 py-3" onClick={stop}>
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(q._id)} aria-label={`Select ${q.name}`} />
      </td>

      <td className="px-3 py-3" onClick={stop}>
        <button
          title="Click to preview"
          onClick={() => onPreview(q)}
          className="block p-1.5 rounded-lg border border-border bg-white hover:border-primary/50 hover:shadow-sm transition"
        >
          <StyledQrPreview value={q.shortUrl} design={design} size={90} />
        </button>
      </td>

      <td className="px-3 py-3">
        <Badge className={`${typeColors[q.type] ?? "bg-secondary text-foreground"} border-0 font-semibold uppercase text-[9px] mb-1`}>{q.type}</Badge>
        <div className="font-semibold text-foreground group-hover:text-primary transition text-sm">{q.name}</div>
        <div className="text-[10px] text-muted-foreground">Created {formatCreatedDate(q.createdAt)}</div>
      </td>

      <td className="px-3 py-3 hidden md:table-cell">
        <div className="flex items-center gap-2 max-w-xs">
          <span className="text-foreground truncate text-xs font-mono">{q.destination}</span>
          {q.isDynamic ? (
            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary shrink-0">DYNAMIC</Badge>
          ) : (
            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>
      </td>

      <td className="px-3 py-3 text-right">
        <div className="font-bold font-heading text-sm">{q.scansTotal.toLocaleString("en-IN")}</div>
        {q.scansToday > 0 && <div className="text-[10px] text-success font-semibold">+{q.scansToday} today</div>}
      </td>

      <td className="px-3 py-3" onClick={stop}>
        <StatusBadge status={q.status} disabled={actionLoading} onToggle={() => onToggleStatus(q)} />
      </td>

      <td className="px-5 py-3" onClick={stop}>
        <div className="flex items-center justify-end gap-1">
          <DownloadMenu qr={q} design={design} compact />
          <RowActionsMenu q={q} design={design} onEdit={onEdit} onDesign={onDesign} onToggleStatus={onToggleStatus} onDelete={onDelete} onAnalytics={onAnalytics} onShare={onShare} />
        </div>
      </td>
    </motion.tr>
  );
}

export function RowActionsMenu({
  q,
  design,
  onEdit,
  onDesign,
  onToggleStatus,
  onDelete,
  onAnalytics,
  onShare,
}: {
  q: QrCode;
  design: QRDesign;
  onEdit: (q: QrCode) => void;
  onDesign: (q: QrCode) => void;
  onToggleStatus: (q: QrCode) => void;
  onDelete: (q: QrCode) => void;
  /** Opens the quick-stats AnalyticsDialog. Falls back to navigating straight to the full analytics page if omitted. */
  onAnalytics?: (q: QrCode) => void;
  /** Opens the full ShareDialog. Falls back to the inline ShareMenu if omitted. */
  onShare?: (q: QrCode) => void;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(q)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Destination
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onDesign(q)}>
          <Palette className="mr-2 h-4 w-4" />
          Customize Design
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => (onAnalytics ? onAnalytics(q) : router.push(`/dashboard/codes/${q._id}`))}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={q.shortUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {onShare ? (
          <DropdownMenuItem onClick={() => onShare(q)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        ) : (
          <div className="px-1 py-1">
            <ShareMenuInline q={q} />
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onDelete(q)} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Small inline wrapper so ShareMenu's own trigger button can live inside the
// dropdown content without nesting two Radix dropdown roots awkwardly.
function ShareMenuInline({ q }: { q: QrCode }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ShareMenu qr={q} />
    </div>
  );
}
