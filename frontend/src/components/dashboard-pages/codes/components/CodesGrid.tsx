// components/dashboard-pages/codes/components/CodesGrid.tsx
"use client";
import CodeCard from "./CodeCard";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import type { QrCode } from "../codes.types";

interface Props {
  items: QrCode[];
  loading: boolean;
  actionLoading: boolean;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (q: QrCode) => void;
  onEdit: (q: QrCode) => void;
  onDesign: (q: QrCode) => void;
  onToggleStatus: (q: QrCode) => void;
  onDelete: (q: QrCode) => void;
  onAnalytics: (q: QrCode) => void;
  onShare: (q: QrCode) => void;
}

export default function CodesGrid({ items, loading, actionLoading, isSelected, onToggleSelect, onPreview, onEdit, onDesign, onToggleStatus, onDelete, onAnalytics, onShare }: Props) {
  if (!loading && items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState />
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="p-4">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((q, i) => (
        <CodeCard
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
    </div>
  );
}
