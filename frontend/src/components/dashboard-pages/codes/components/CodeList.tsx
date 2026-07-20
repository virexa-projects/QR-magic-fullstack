// components/dashboard-pages/codes/components/CodeList.tsx
"use client";
import { Checkbox } from "@/components/ui/checkbox";
import CodeRow from "./CodeRow";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import type { QrCode } from "../codes.types";

const COL_COUNT = 7;

interface Props {
  items: QrCode[];
  loading: boolean;
  actionLoading: boolean;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  allOnPageSelected: boolean;
  onToggleAllOnPage: () => void;
  onPreview: (q: QrCode) => void;
  onEdit: (q: QrCode) => void;
  onDesign: (q: QrCode) => void;
  onToggleStatus: (q: QrCode) => void;
  onDelete: (q: QrCode) => void;
  onAnalytics: (q: QrCode) => void;
  onShare: (q: QrCode) => void;
}

export default function CodeList({
  items,
  loading,
  actionLoading,
  isSelected,
  onToggleSelect,
  allOnPageSelected,
  onToggleAllOnPage,
  onPreview,
  onEdit,
  onDesign,
  onToggleStatus,
  onDelete,
  onAnalytics,
  onShare,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="pl-5 py-3 w-10">
              <Checkbox checked={allOnPageSelected} onCheckedChange={onToggleAllOnPage} aria-label="Select all on page" />
            </th>
            <th className="text-left font-semibold px-3 py-3">QR</th>
            <th className="text-left font-semibold px-3 py-3">Name & Type</th>
            <th className="text-left font-semibold px-3 py-3 hidden md:table-cell">Destination</th>
            <th className="text-right font-semibold px-3 py-3">Scans</th>
            <th className="text-left font-semibold px-3 py-3">Status</th>
            <th className="text-right font-semibold px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && items.length === 0 && <EmptyState asTableRow colSpan={COL_COUNT} />}
          {loading && items.length === 0 && <LoadingState asTableRow colSpan={COL_COUNT} />}
          {items.map((q, i) => (
            <CodeRow
              key={q._id}
              q={q}
              index={i}
              selected={isSelected(q._id)}
              onToggleSelect={onToggleSelect}
              onPreview={onPreview}
              onEdit={onEdit}
              onDesign={onDesign}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onAnalytics={onAnalytics}
              onShare={onShare}
              actionLoading={actionLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
