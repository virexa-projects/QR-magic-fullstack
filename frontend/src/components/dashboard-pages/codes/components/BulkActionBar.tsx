// components/dashboard-pages/codes/components/BulkActionBar.tsx
"use client";
import { Pause, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  onClear: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  busy?: boolean;
}

export default function BulkActionBar({ count, onClear, onPause, onResume, onDelete, busy }: Props) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5">
      <div className="flex items-center gap-2">
        <button onClick={onClear} className="p-1 rounded-md hover:bg-primary/10" title="Clear selection">
          <X className="w-3.5 h-3.5 text-primary" />
        </button>
        <span className="text-sm font-semibold text-primary">{count} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={onResume} className="h-8 gap-1.5 text-xs">
          <Play className="w-3.5 h-3.5" /> Resume
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onPause} className="h-8 gap-1.5 text-xs">
          <Pause className="w-3.5 h-3.5" /> Pause
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onDelete} className="h-8 gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
